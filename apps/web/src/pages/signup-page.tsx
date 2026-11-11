import { typeboxResolver } from "@hookform/resolvers/typebox";
import { SignUp } from "@mystatistics/shared";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { paths } from "@/app/paths";
import { FormAlert, FormField } from "@/components/forms/form-field";
import { PixelButton } from "@/components/game/pixel-button";
import { EntryScreen } from "@/components/layout/entry-screen";
import { Input } from "@/components/ui/input";
import { fieldErrorMessage, setApiError } from "@/lib/form-errors";
import { useSignUp } from "@/queries/auth";

function lengthMessage(min: number | undefined, max: number | undefined): string {
  if (min !== undefined && max !== undefined) return `Use ${min} to ${max} characters.`;
  if (min !== undefined) return `Use at least ${min} characters.`;
  if (max !== undefined) return `Use at most ${max} characters.`;
  return "Enter a password.";
}

// Limits read from the schema the server validates, so the message follows it.
const PASSWORD_MESSAGE = lengthMessage(SignUp.properties.password.minLength, SignUp.properties.password.maxLength);
const SLUG_HINT = "3–30 characters: lowercase letters, numbers and hyphens, not at the start or end.";

/** `/signup` — e-mail, password and the public profile slug, validated with the same `SignUp` schema as the server. */
export function SignupPage() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const form = useForm<SignUp>({
    resolver: typeboxResolver(SignUp),
    defaultValues: { email: "", password: "", slug: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const slug = useWatch({ control: form.control, name: "slug" });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signUp.mutateAsync(values);
      navigate(paths.dashboard, { replace: true });
    } catch (error) {
      // EMAIL_TAKEN / SLUG_TAKEN on their field; VALIDATION and anything else above the fields.
      setApiError(form, error, { EMAIL_TAKEN: "email", SLUG_TAKEN: "slug" });
    }
  });

  return (
    <EntryScreen title="New player">
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
        <FormField
          label="Password"
          hint={PASSWORD_MESSAGE}
          error={fieldErrorMessage(errors.password, PASSWORD_MESSAGE)}
        >
          {(control) => (
            <Input {...control} type="password" autoComplete="new-password" {...form.register("password")} />
          )}
        </FormField>
        <FormField
          label="Profile name"
          hint={
            <>
              {SLUG_HINT} Your public link:{" "}
              <span className="font-mono text-mut">{paths.portfolio(slug || "your-name")}</span>
            </>
          }
          error={fieldErrorMessage(errors.slug, SLUG_HINT)}
        >
          {(control) => (
            <Input
              {...control}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="your-name"
              className="font-mono"
              {...form.register("slug")}
            />
          )}
        </FormField>
        <PixelButton type="submit" size="lg" block disabled={isSubmitting} className="mt-1">
          {isSubmitting ? "Creating…" : "Create account"}
        </PixelButton>
      </form>
      <p className="text-xs text-mut">
        Already registered? <Link to={paths.login}>Sign in</Link>
      </p>
    </EntryScreen>
  );
}
