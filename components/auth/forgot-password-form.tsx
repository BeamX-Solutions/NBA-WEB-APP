"use client";

import { useState, type FormEvent } from "react";
import { AuthField, AuthSeal, AuthStatus, AuthSwitchLink } from "./auth-ui";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm({ initialError = "" }: { initialError?: string }) {
  const [message, setMessage] = useState(initialError);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim().toLowerCase();
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?flow=recovery`,
      });
      if (error) { setMessage("The reset request could not be sent. Please try again later."); return; }
      setMessage("If an account exists for that email, you will receive a password reset link.");
    } catch {
      setMessage("The reset request could not be sent. Please try again later.");
    } finally {
      setPending(false);
    }
  }
  return <main className="auth-page auth-page--login"><section aria-labelledby="recovery-title" className="auth-card auth-recovery-card"><div className="auth-login-heading"><AuthSeal large/><h1 id="recovery-title">Forgot Password?</h1><p>Enter your registered email address to reset your password.</p></div><form className="auth-form" onSubmit={submit}><AuthField id="recovery-email" label="Email Address"><input autoComplete="email" className="auth-input" id="recovery-email" name="email" placeholder="Enter your registered email" required type="email"/></AuthField><button className="auth-submit" disabled={pending} type="submit">{pending ? "Sending…" : "Continue"}</button>{message ? <AuthStatus>{message}</AuthStatus> : null}</form><div className="auth-divider"/><AuthSwitchLink href="/login" prefix="Remember your password?" text="Log In"/></section></main>;
}
