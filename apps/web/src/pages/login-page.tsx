import { typeboxResolver } from "@hookform/resolvers/typebox";
import { SignIn } from "@mystatistics/shared";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { paths } from "@/app/paths";
import { FormAlert, FormField } from "@/components/forms/form-field";
import { PixelButton } from "@/components/game/pixel-button";
import { EntryScreen } from "@/components/layout/entry-screen";
import { Input } from "@/components/ui/input";
import { fieldErrorMessage, setApiError } from "@/lib/form-errors";
import { useSignIn } from "@/queries/auth";

/** `/login` — e-mail and password, validated with the same `SignIn` schema as the server. */
export function LoginPage() {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const form = useForm<SignIn>({
    resolver: typeboxResolver(SignIn),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn.mutateAsync(values);
      navigate(paths.dashboard, { replace: true });
    } catch (error) {
      // INVALID_CREDENTIALS, VALIDATION and anything else go above the fields.
      setApiError(form, error);
    }
  });

  return (
    <EntryScreen title="Enter the System">
      <form noValidate onSubmit={onSubmit} className="flex w-full flex-col gap-3.5">
        <FormAlert message={errors.root?.server?.message} />
        <FormField label="Email" error={fieldErrorMessage(errors.email, "Enter a valid email address.")}>
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              autoFocus
              {...form.register("email", { setValueAs: (value: string) => value.trim() })}
            />
          )}
        </FormField>
        <FormField label="Password" error={fieldErrorMessage(errors.password, "Enter your password.")}>
          {(control) => (
            <Input {...control} type="password" autoComplete="current-password" {...form.register("password")} />
          )}
        </FormField>
        <PixelButton type="submit" size="lg" block disabled={isSubmitting} className="mt-1">
          {isSubmitting ? "Entering…" : "Enter"}
        </PixelButton>
      </form>
      <p className="text-xs text-mut">
        New here? <Link to={paths.signup}>Create an account</Link>
      </p>
    </EntryScreen>
  );
}
