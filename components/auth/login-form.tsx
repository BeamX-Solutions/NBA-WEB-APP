"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthFooterLink, AuthScreen, FormMessage, Seal } from "@/components/auth/auth-screen";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { TextField } from "@/components/mobile/field";
import { Icon } from "@/components/mobile/icon";
import { ATTRIBUTION, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/branding";
import { friendlyAuthError } from "@/lib/auth/errors";
import { normalizeEmail, safeInternalPath, validateEmail } from "@/lib/auth/validation";
import { ADMINISTRATOR_PATH, loadPractitionerAccess } from "@/lib/practitioner/access";
import { createClient } from "@/lib/supabase/client";

type LoginErrors = Partial<Record<"email" | "password", string>>;

/** mobile (auth)/login. */
export function LoginForm({ initialError = "", initialSuccess = "" }: { initialError?: string; initialSuccess?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState(initialError || initialSuccess);
  const [messageTone, setMessageTone] = useState<"error" | "success">(initialError ? "error" : "success");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const email = normalizeEmail(String(new FormData(event.currentTarget).get("email") ?? ""));
    const nextErrors: LoginErrors = {};
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (!password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      const client = createClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        setMessageTone("error");
        setMessage(friendlyAuthError(error, "login"));
        return;
      }
      setPassword("");
      // As on mobile, an administrator's session is ended before anything renders.
      const access = await loadPractitionerAccess(client, data.user.id);
      if (access.kind === "administrator") await client.auth.signOut();
      router.replace(access.kind === "administrator" ? ADMINISTRATOR_PATH : safeInternalPath(new URLSearchParams(window.location.search).get("next")));
      router.refresh();
    } catch (error) {
      setMessageTone("error");
      setMessage(friendlyAuthError(error, "login"));
    } finally {
      setPending(false);
    }
  }

  const toggle = <button aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} className="grid place-items-center border-0 bg-transparent p-1 text-text-muted" onClick={() => setVisible(!visible)} type="button"><Icon name={visible ? "visibility" : "visibility-off"} size={22}/></button>;

  return <AuthScreen>
    <Card>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4"><Seal size={92}/></div>
        <h1 className="m-0 font-heading text-heading font-bold text-text">{PRODUCT_NAME}</h1>
        <p className="mt-2 text-body leading-[21px] text-text-muted">Log in to access your dashboard and calculator.</p>
      </div>
      <form noValidate onSubmit={submit}>
        <TextField autoComplete="email" error={errors.email} id="login-email" label="Email Address" name="email" onChange={() => setErrors((current) => ({ ...current, email: undefined }))} placeholder="Enter your registered email" type="email"/>
        <TextField autoComplete="current-password" error={errors.password} id="login-password" label="Password" labelAside={<Link className="text-label font-semibold text-primary" href="/forgot-password">Forgot Password?</Link>} name="password" onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }} placeholder="Enter your password" trailing={toggle} type={visible ? "text" : "password"} value={password}/>
        <div className="mt-2">{message ? <FormMessage tone={messageTone}>{message}</FormMessage> : null}</div>
        <Button loading={pending} type="submit">Log In</Button>
      </form>
      <div className="my-4 h-px bg-border"/>
      <AuthFooterLink href="/register" prefix="Don't have an account?" text="Register here"/>
    </Card>
    <p className="mt-6 text-center text-caption tracking-[0.5px] text-text-muted">{ATTRIBUTION}</p>
    <p className="mt-1 text-center text-caption text-text-disabled">{PRODUCT_TAGLINE}</p>
  </AuthScreen>;
}
