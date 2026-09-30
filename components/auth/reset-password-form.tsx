"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthScreen, FormMessage } from "@/components/auth/auth-screen";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { TextField } from "@/components/mobile/field";
import { friendlyAuthError } from "@/lib/auth/errors";
import { validatePassword } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

type ResetErrors = Partial<Record<"confirmation" | "password", string>>;

/** Web only (mobile resets in the browser); laid out like the mobile Forgot Password card. */
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

  return <AuthScreen>
    <Card>
      <div className="mb-4 flex flex-col items-center text-center">
        <h1 className="m-0 text-heading font-bold text-text">Set New Password</h1>
        <p className="mt-2 text-body leading-[21px] text-text-muted">Choose a new password for your account.</p>
      </div>
      <form noValidate onSubmit={submit}>
        <TextField autoComplete="new-password" error={errors.password} id="reset-password" label="New Password" onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }} placeholder="At least 8 characters" type="password" value={password}/>
        <TextField autoComplete="new-password" error={errors.confirmation} id="reset-confirm" label="Confirm New Password" onChange={(event) => { setConfirmation(event.target.value); setErrors((current) => ({ ...current, confirmation: undefined })); }} placeholder="Re-enter the new password" type="password" value={confirmation}/>
        {message ? <FormMessage tone="error">{message}</FormMessage> : null}
        <Button disabled={!ready} loading={pending} type="submit">{ready ? "Update Password" : "Checking link…"}</Button>
      </form>
      <Link className="mt-4 block text-center text-label font-semibold text-primary" href="/login">Back to Login</Link>
    </Card>
  </AuthScreen>;
}
