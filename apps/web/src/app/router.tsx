/**
 * The whole route tree lives here (D2). Pages in src/pages use only Link,
 * Navigate, useNavigate and useParams from react-router, so moving to
 * TanStack Router later touches this file and a few call sites.
 */
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { CrashPage } from "@/pages/crash-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { PortfolioPage } from "@/pages/portfolio-page";
import { SignupPage } from "@/pages/signup-page";

const router = createBrowserRouter([
  {
    errorElement: <CrashPage />,
    children: [
      // Protected in T4.1 (logged out → /login).
      { path: "/", element: <DashboardPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/u/:slug", element: <PortfolioPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
