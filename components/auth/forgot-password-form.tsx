"use client";

import { useState, type FormEvent } from "react";
import { AuthField, AuthSeal, AuthStatus, AuthSwitchLink } from "./auth-ui";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/auth/errors";
import { normalizeEmail, validateEmail } from "@/lib/auth/validation";

export function ForgotPasswordForm({ initialError = "" }: { initialError?: string }) {
  const [message, setMessage] = useState(initialError);
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");
  const [emailError, setEmailError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const email = normalizeEmail(String(new FormData(event.currentTarget).get("email") ?? ""));
    const validationError = validateEmail(email);
    setEmailError(validationError ?? "");
    if (validationError) return;
    setPending(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email);
      if (error) {
        setMessageTone("error");
        setMessage(friendlyAuthError(error, "request-reset"));
        return;
      }
      setMessageTone("success");
      setMessage("If an account exists for that email, you will receive a password reset link.");
    } catch (error) {
      setMessageTone("error");
      setMessage(friendlyAuthError(error, "request-reset"));
    } finally {
      setPending(false);
    }
  }
  return <main className="auth-page auth-page--login"><section aria-labelledby="recovery-title" className="auth-card auth-recovery-card"><div className="auth-login-heading"><AuthSeal large/><h1 id="recovery-title">Forgot Password?</h1><p>Enter your registered email address to reset your password.</p></div><form className="auth-form" noValidate onSubmit={submit}><AuthField error={emailError} id="recovery-email" label="Email Address"><input aria-describedby={emailError ? "recovery-email-error" : undefined} aria-invalid={Boolean(emailError)} autoComplete="email" className="auth-input" id="recovery-email" name="email" onChange={() => setEmailError("")} placeholder="Enter your registered email" required type="email"/></AuthField><button className="auth-submit" disabled={pending} type="submit">{pending ? "Sending…" : "Continue"}</button>{message ? <AuthStatus tone={messageTone}>{message}</AuthStatus> : null}</form><div className="auth-divider"/><AuthSwitchLink href="/login" prefix="Remember your password?" text="Log In"/></section></main>;
}
