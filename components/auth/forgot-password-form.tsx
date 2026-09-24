"use client";

import { useState, type FormEvent } from "react";
import { AuthField, AuthSeal, AuthStatus, AuthSwitchLink } from "./auth-ui";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Password recovery is unavailable until Supabase authentication is configured. No email was sent.");
  }
  return <main className="auth-page auth-page--login"><section aria-labelledby="recovery-title" className="auth-card auth-recovery-card"><div className="auth-login-heading"><AuthSeal large/><h1 id="recovery-title">Forgot Password?</h1><p>Enter your registered email address to reset your password.</p></div><form className="auth-form" onSubmit={submit}><AuthField id="recovery-email" label="Email Address"><input autoComplete="email" className="auth-input" id="recovery-email" name="email" placeholder="Enter your registered email" required type="email"/></AuthField><button className="auth-submit" type="submit">Continue</button>{message ? <AuthStatus>{message}</AuthStatus> : null}</form><div className="auth-divider"/><AuthSwitchLink href="/login" prefix="Remember your password?" text="Log In"/></section></main>;
}
