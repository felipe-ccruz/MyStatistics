import type { ApiError } from "@mystatistics/shared";

/** API error code (docs/contract.md) for a call without a valid session. */
export const UNAUTHORIZED_ERROR = "UNAUTHORIZED";

/** Front-only error code: the request never got an answer from the API. */
export const NETWORK_ERROR = "NETWORK";
/** Front-only error code: the API answered with something that is not an `ApiError`. */
export const UNEXPECTED_RESPONSE_ERROR = "UNEXPECTED_RESPONSE";

const NETWORK_MESSAGE = "Could not reach the server. Check your connection and try again.";

/** Every failed call throws this, with the `code` and `message` of the API's `ApiError`. */
export class ApiRequestError extends Error {
  /** HTTP status; 0 when the request never got a response. */
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const { error } = value;
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    "code" in error &&
    typeof error.code === "string"
  );
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function invalidResponse(status: number) {
  return new ApiRequestError(status, UNEXPECTED_RESPONSE_ERROR, "The server sent an invalid response.");
}

/** Statuses a bare (non-ApiError) answer gets when the dev proxy cannot reach the API. */
const UNREACHABLE_STATUSES = new Set([500, 502, 503, 504]);

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialized as JSON. Type it with the request schema from @mystatistics/shared. */
  body?: unknown;
  signal?: AbortSignal;
  /** Non-2xx statuses whose body is still the success contract (e.g. 503 on /api/health). */
  acceptStatus?: readonly number[];
};

/**
 * Calls the API through the relative `/api/...` path (the Vite proxy forwards it),
 * sending the session cookie. `T` must be a response contract from @mystatistics/shared.
 * Only a 2xx with no body (204) resolves to `undefined`: use `api<void>` for it. A status
 * from `acceptStatus` must carry a JSON body that is not an `ApiError`, or the call throws.
 */
export async function api<T>(path: `/api/${string}`, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, signal, acceptStatus = [] } = options;

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    // Cancellation is not a failure: let TanStack Query handle the abort.
    if (signal?.aborted) throw error;
    throw new ApiRequestError(0, NETWORK_ERROR, NETWORK_MESSAGE);
  }

  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    // Aborted while the body was streaming: same as an abort before the response.
    if (signal?.aborted) throw error;
    throw new ApiRequestError(response.status, NETWORK_ERROR, NETWORK_MESSAGE);
  }
  const data = text ? parseJson(text) : undefined;

  if (response.ok) {
    // 2xx without a body (204) is the only case that resolves to `undefined`.
    if (!text) return undefined as T;
    if (data === undefined) throw invalidResponse(response.status);
    return data as T;
  }

  if (acceptStatus.includes(response.status)) {
    // An accepted error status must still carry the success contract: an empty body or an
    // `ApiError` there is a failure, never `undefined as T`.
    if (isApiError(data)) throw new ApiRequestError(response.status, data.error.code, data.error.message);
    if (data === undefined) throw invalidResponse(response.status);
    return data as T;
  }

  if (isApiError(data)) {
    throw new ApiRequestError(response.status, data.error.code, data.error.message);
  }
  if (UNREACHABLE_STATUSES.has(response.status)) {
    throw new ApiRequestError(response.status, NETWORK_ERROR, NETWORK_MESSAGE);
  }
  throw new ApiRequestError(
    response.status,
    UNEXPECTED_RESPONSE_ERROR,
    `Unexpected response from the server (${response.status}).`,
  );
}
