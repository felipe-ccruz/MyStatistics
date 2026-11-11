/** Every URL the app links to, in one place (the route tree is in ./router.tsx). */
export const paths = {
  dashboard: "/",
  login: "/login",
  signup: "/signup",
  portfolio: (slug: string) => `/u/${encodeURIComponent(slug)}`,
} as const;
