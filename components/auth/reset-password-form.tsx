"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AuthField, AuthSeal, AuthStatus, AuthSwitchLink } from "./auth-ui";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/auth/errors";
import { validatePassword } from "@/lib/auth/validation";
import { useRouter } from "next/navigation";

type ResetErrors = Partial<Record<"confirmation" | "password", string>>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ResetErrors>({});
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    createClient().auth.getUser().then(({ data: { user }, error }) => {
      if (!active) return;
      if (error || !user) setMessage("This reset link is invalid or expired. Request a new one.");
      else setReady(true);
    }).catch((error: unknown) => {
      if (active) setMessage(friendlyAuthError(error, "reset-password"));
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: ResetErrors = {};
    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;
    if (!confirmation) nextErrors.confirmation = "Confirm your new password.";
    else if (password !== confirmation) nextErrors.confirmation = "The passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !ready) return;
    setPending(true);
    setMessage("");
    try {
      const client = createClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) { setMessage("This reset link is invalid or expired. Request a new one."); return; }
      const { error } = await client.auth.updateUser({ password });
      if (error) { setMessage(friendlyAuthError(error, "reset-password")); return; }
      setPassword("");
      setConfirmation("");
      await client.auth.signOut();
      router.replace("/login?auth_notice=password-updated");
      router.refresh();
    } catch (error) {
      setMessage(friendlyAuthError(error, "reset-password"));
    } finally {
      setPending(false);
    }
  }

  return <main className="auth-page auth-page--login"><section aria-labelledby="reset-title" className="auth-card auth-recovery-card"><div className="auth-login-heading"><AuthSeal large/><h1 id="reset-title">Set New Password</h1><p>Choose a new password for your account.</p></div><form className="auth-form" noValidate onSubmit={submit}><AuthField error={errors.password} id="reset-password" label="New Password"><input aria-describedby={errors.password ? "reset-password-error" : undefined} aria-invalid={Boolean(errors.password)} autoComplete="new-password" className="auth-input" id="reset-password" onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }} required type="password" value={password}/></AuthField><AuthField error={errors.confirmation} id="reset-confirm" label="Confirm New Password"><input aria-describedby={errors.confirmation ? "reset-confirm-error" : undefined} aria-invalid={Boolean(errors.confirmation)} autoComplete="new-password" className="auth-input" id="reset-confirm" onChange={(event) => { setConfirmation(event.target.value); setErrors((current) => ({ ...current, confirmation: undefined })); }} required type="password" value={confirmation}/></AuthField><button className="auth-submit" disabled={pending || !ready} type="submit">{pending ? "Updating…" : ready ? "Update Password" : "Checking link…"}</button>{message ? <AuthStatus tone="error">{message}</AuthStatus> : null}</form><div className="auth-divider"/><AuthSwitchLink href="/login" prefix="Remember your password?" text="Log In"/></section></main>;
}
