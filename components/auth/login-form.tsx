"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthField, AuthSeal, AuthStatus, AuthSwitchLink } from "./auth-ui";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function VisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" height="23" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="23">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!visible ? <path d="m3 3 18 18" strokeWidth="2.3" /> : null}
    </svg>
  );
}

export function LoginForm({ initialError = "" }: { initialError?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(initialError);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) { setMessage(error.message); return; }
      setPassword("");
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(next) ? next : "/");
      router.refresh();
    } catch {
      setMessage("Log in could not be completed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page auth-page--login">
      <div className="auth-login-wrap">
        <section aria-labelledby="login-title" className="auth-card auth-login-card">
          <div className="auth-login-heading">
            <AuthSeal large />
            <h1 id="login-title">NBA Legal Fees</h1>
            <p>Log in to access your dashboard and calculator.</p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <AuthField id="login-email" label="Email Address">
              <input autoComplete="email" className="auth-input" id="login-email" name="email" placeholder="Enter your registered email" required type="email" />
            </AuthField>
            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="login-password">Password</label>
                <Link href="/forgot-password">Forgot Password?</Link>
              </div>
              <div className="auth-password-wrap">
                <input autoComplete="current-password" className="auth-input" id="login-password" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required type={visible ? "text" : "password"} value={password} />
                <button aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} className="auth-visibility" onClick={() => setVisible(!visible)} type="button">
                  <VisibilityIcon visible={visible} />
                </button>
              </div>
            </div>
            <button className="auth-submit" disabled={pending} type="submit">{pending ? "Logging in…" : "Log In"}</button>
            {message ? <AuthStatus>{message}</AuthStatus> : null}
          </form>

          <div className="auth-divider" />
          <AuthSwitchLink href="/register" prefix="Don't have an account?" text="Register here" />
        </section>
        <p className="auth-attribution">An initiative of the NBA Anaocha Branch<br /><span>Fee computation and compliance for legal practitioners.</span></p>
      </div>
    </main>
  );
}
