import type { FieldError, FieldValues, Path, UseFormReturn } from "react-hook-form";
import { errorMessage } from "@/components/states/error-state";
import { isApiRequestError } from "./api";

/** `type` of the errors set from an API answer (vs. the schema errors of the resolver). */
const SERVER_ERROR = "server";

/**
 * Puts an API failure on the form: on the field its `code` belongs to (e.g.
 * `EMAIL_TAKEN` → email), or above the fields (`root.server`) for anything else.
 */
export function setApiError<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
  fieldByCode: Partial<Record<string, Path<T>>> = {},
) {
  const message = errorMessage(error);
  const field = isApiRequestError(error) ? fieldByCode[error.code] : undefined;
  if (field) {
    form.setError(field, { type: SERVER_ERROR, message }, { shouldFocus: true });
  } else {
    form.setError("root.server", { type: SERVER_ERROR, message });
  }
}

/**
 * Message for a field error. Errors from the API keep their own message; schema errors
 * from the TypeBox resolver ("Expected string to match '^[a-z0-9]…'") get `friendly`.
 */
export function fieldErrorMessage(error: FieldError | undefined, friendly: string): string | undefined {
  if (!error) return undefined;
  return error.type === SERVER_ERROR && error.message ? error.message : friendly;
}
