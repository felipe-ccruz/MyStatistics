import { Link } from "react-router";
import { paths } from "@/app/paths";
import { EntryScreen } from "@/components/layout/entry-screen";

/** `/signup` — shell only; the sign-up form arrives in T4.2. */
export function SignupPage() {
  return (
    <EntryScreen title="New player">
      <p className="text-xs text-mut">Creating an account is not available yet.</p>
      <p className="text-xs text-mut">
        Already registered? <Link to={paths.login}>Sign in</Link>
      </p>
    </EntryScreen>
  );
}
