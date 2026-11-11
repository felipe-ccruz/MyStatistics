import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { paths } from "@/app/paths";
import { PixelButton } from "@/components/game/pixel-button";
import { notify } from "@/components/game/system-toast";
import { errorMessage } from "@/components/states/error-state";
import { useSignOut } from "@/queries/auth";

/** Header button: POST /api/auth/logout, clears the query cache, then goes to /login. */
export function LogoutButton() {
  const navigate = useNavigate();
  const signOut = useSignOut();

  async function logOut() {
    try {
      // The cache is already cleared (and ["me"] is null) when this resolves, so /login does not bounce back.
      await signOut.mutateAsync();
      navigate(paths.login, { replace: true });
    } catch (error) {
      notify.error("Could not log out", errorMessage(error));
    }
  }

  return (
    <PixelButton variant="outline" disabled={signOut.isPending} onClick={() => void logOut()}>
      <LogOut aria-hidden="true" className="size-3.5 text-acc" />
      {signOut.isPending ? "Logging out…" : "Log out"}
    </PixelButton>
  );
}
