/**
 * The whole route tree lives here (D2). Pages in src/pages use only Link,
 * Navigate, useNavigate and useParams from react-router, so moving to
 * TanStack Router later touches this file and a few call sites.
 */
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { SessionScreen } from "@/components/layout/session-screen";
import { CrashPage } from "@/pages/crash-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { PortfolioPage } from "@/pages/portfolio-page";
import { SignupPage } from "@/pages/signup-page";
import { useMe } from "@/queries/auth";
import { paths } from "./paths";

/**
 * Renders its routes only for the session state they need. Until the first answer of
 * GET /api/auth/me arrives it shows a full-screen loading state; if that check fails
 * (server down), a full-screen error with retry. Once there is an answer, a later
 * refetch failure keeps the page instead of replacing it.
 */
function SessionGate({ need }: { need: "user" | "guest" }) {
  const me = useMe();

  if (me.data === undefined) {
    if (me.isError) {
      return (
        <SessionScreen status="error" error={me.error} onRetry={() => void me.refetch()} retrying={me.isFetching} />
      );
    }
    return <SessionScreen status="loading" />;
  }

  if (need === "user" && me.data === null) return <Navigate to={paths.login} replace />;
  if (need === "guest" && me.data !== null) return <Navigate to={paths.dashboard} replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    errorElement: <CrashPage />,
    children: [
      {
        // Logged out → /login.
        element: <SessionGate need="user" />,
        children: [{ path: paths.dashboard, element: <DashboardPage /> }],
      },
      {
        // Logged in → /.
        element: <SessionGate need="guest" />,
        children: [
          { path: paths.login, element: <LoginPage /> },
          { path: paths.signup, element: <SignupPage /> },
        ],
      },
      // Public: works logged in or out.
      { path: "/u/:slug", element: <PortfolioPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
