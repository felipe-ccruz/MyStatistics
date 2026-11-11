import { Link } from "react-router";
import { paths } from "@/app/paths";
import { EntryScreen } from "@/components/layout/entry-screen";

/** `/login` — shell only; the sign-in form arrives in T4.2. */
export function LoginPage() {
  return (
    <EntryScreen title="Enter the System">
      <p className="text-xs text-mut">Signing in is not available yet.</p>
      <p className="text-xs text-mut">
        New here? <Link to={paths.signup}>Create an account</Link>
      </p>
    </EntryScreen>
  );
}
