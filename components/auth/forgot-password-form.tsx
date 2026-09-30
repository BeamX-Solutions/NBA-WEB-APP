"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthScreen, FormMessage } from "@/components/auth/auth-screen";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { TextField } from "@/components/mobile/field";
import { friendlyAuthError } from "@/lib/auth/errors";
import { normalizeEmail, validateEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

/** mobile (auth)/forgot-password. Always reports success, so it never reveals which addresses are registered. */
export function ForgotPasswordForm({ initialError = "" }: { initialError?: string }) {
  const [message, setMessage] = useState(initialError);
  const [emailError, setEmailError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

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
        setMessage(friendlyAuthError(error, "request-reset"));
        return;
      }
      setSent(true);
    } catch (error) {
      setMessage(friendlyAuthError(error, "request-reset"));
    } finally {
      setPending(false);
    }
  }

  return <AuthScreen>
    <Card>
      <div className="mb-4 flex flex-col items-center text-center">
        <h1 className="m-0 text-heading font-bold text-text">Forgot Password</h1>
        <p className="mt-2 text-body leading-[21px] text-text-muted">Enter your registered email address to receive a password reset link.</p>
      </div>
      {sent ? <p className="py-4 text-center text-body leading-[22px] text-success" role="status">If that address is registered, a reset link is on its way. Check your inbox and your spam folder.</p> : <form noValidate onSubmit={submit}>
        <TextField autoComplete="email" error={emailError} id="recovery-email" label="Email Address" name="email" onChange={() => setEmailError("")} placeholder="practitioner@example.com" type="email"/>
        {message ? <FormMessage tone="error">{message}</FormMessage> : null}
        <Button loading={pending} type="submit">Send Reset Link</Button>
      </form>}
      <Link className="mt-4 block text-center text-label font-semibold text-primary" href="/login">Back to Login</Link>
    </Card>
  </AuthScreen>;
}
