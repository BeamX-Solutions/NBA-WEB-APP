"use client";

import { useState, type FormEvent } from "react";
import { AuthField, AuthSeal, AuthStatus, AuthSwitchLink } from "./auth-ui";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) { setMessage("The passwords do not match."); return; }
    setPending(true);
    setMessage("");
    try {
      const client = createClient();
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) { setMessage("This reset link has expired. Request a new one."); return; }
      const { error } = await client.auth.updateUser({ password });
      if (error) { setMessage(error.message); return; }
      setPassword("");
      setConfirmation("");
      await client.auth.signOut();
      setMessage("Password updated. Log in with your new password.");
    } catch {
      setMessage("The password could not be updated. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <main className="auth-page auth-page--login"><section aria-labelledby="reset-title" className="auth-card auth-recovery-card"><div className="auth-login-heading"><AuthSeal large/><h1 id="reset-title">Set New Password</h1><p>Choose a new password for your account.</p></div><form className="auth-form" onSubmit={submit}><AuthField id="reset-password" label="New Password"><input autoComplete="new-password" className="auth-input" id="reset-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password}/></AuthField><AuthField id="reset-confirm" label="Confirm New Password"><input autoComplete="new-password" className="auth-input" id="reset-confirm" minLength={8} onChange={(event) => setConfirmation(event.target.value)} required type="password" value={confirmation}/></AuthField><button className="auth-submit" disabled={pending} type="submit">{pending ? "Updating…" : "Update Password"}</button>{message ? <AuthStatus>{message}</AuthStatus> : null}</form><div className="auth-divider"/><AuthSwitchLink href="/login" prefix="Remember your password?" text="Log In"/></section></main>;
}
