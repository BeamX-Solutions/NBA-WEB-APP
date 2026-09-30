"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthFooterLink, AuthScreen, FormMessage, Seal } from "@/components/auth/auth-screen";
import { Button, ButtonLink } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { SelectField, TextField } from "@/components/mobile/field";
import { ScreenHeading } from "@/components/mobile/screen";
import { IconCircle } from "@/components/mobile/states";
import { listSignupBranches, type SignupBranch } from "@/lib/auth/branches";
import { friendlyAuthError } from "@/lib/auth/errors";
import { normalizeEmail, validateRegistration, type RegisterField, type RegisterFieldErrors } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

/** mobile (auth)/register, including its "Confirm your email" state. */
export function RegisterForm() {
  const router = useRouter();
  const [branchCode, setBranchCode] = useState("");
  const [branches, setBranches] = useState<SignupBranch[]>([]);
  const [branchLoading, setBranchLoading] = useState(true);
  const [branchLoadError, setBranchLoadError] = useState(false);
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState<string | null>(null);

  const loadBranches = useCallback(() => {
    let active = true;
    listSignupBranches(createClient())
      .then((list) => { if (active) setBranches(list); })
      .catch(() => { if (active) setBranchLoadError(true); })
      .finally(() => { if (active) setBranchLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => loadBranches(), [loadBranches]);

  function retryBranches() {
    setBranchLoading(true);
    setBranchLoadError(false);
    loadBranches();
  }

  function clearError(field: RegisterField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("name") ?? "").trim();
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const phone = String(form.get("phone") ?? "").trim();
    const scn = String(form.get("scn") ?? "").trim();
    const branch = branches.find((item) => item.branch_code === branchCode);
    const nextErrors = validateRegistration({ branchSelected: Boolean(branch), confirmation, email, fullName, password, phone, scn });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !branch) return;

    setPending(true);
    try {
      const { data, error } = await createClient().auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone, scn, branch_code: branch.branch_code },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage(friendlyAuthError(error, "register"));
        return;
      }
      setPassword("");
      setConfirmation("");
      if (data.session) {
        router.replace("/");
        router.refresh();
        return;
      }
      setAwaitingEmail(email);
    } catch (error) {
      setMessage(friendlyAuthError(error, "register"));
    } finally {
      setPending(false);
    }
  }

  if (awaitingEmail) {
    return <AuthScreen>
      <Card className="flex flex-col items-center text-center">
        <IconCircle icon="mark-email-unread"/>
        <h1 className="m-0 text-title font-bold text-text">Confirm your email</h1>
        <p className="mt-3 text-body leading-[22px] text-text">We have sent a confirmation link to {awaitingEmail}. Open it to activate your account, then log in.</p>
        <p className="mt-3 text-caption text-text-muted">Check your spam folder if it has not arrived within a few minutes.</p>
        <div className="mt-6 w-full"><ButtonLink href="/login" variant="outline">Go to Log In</ButtonLink></div>
      </Card>
    </AuthScreen>;
  }

  const branchPlaceholder = branchLoading ? "Loading branches..." : branches.length ? "Select your branch" : "No branches available";
  const branchError = errors.branch ?? (branchLoadError ? "The list of branches could not be loaded." : !branchLoading && !branches.length ? "No branches are available for registration." : undefined);

  return <AuthScreen centred={false}>
    <div className="mb-3 flex justify-center"><Seal size={64}/></div>
    <ScreenHeading subtitle="Register as a legal practitioner to access official services and fee calculators." title="Create Account"/>
    <Card>
      <form noValidate onSubmit={submit}>
        <TextField autoCapitalize="words" autoComplete="name" error={errors.fullName} id="register-name" label="Full Name (As on Call to Bar Certificate)" name="name" onChange={() => clearError("fullName")} placeholder="e.g. Jane Doe"/>
        <TextField autoComplete="email" error={errors.email} id="register-email" label="Official Email Address" name="email" onChange={() => clearError("email")} placeholder="jane.doe@example.com" type="email"/>
        <TextField autoComplete="tel" error={errors.phone} id="register-phone" label="Phone Number" name="phone" onChange={() => clearError("phone")} placeholder="+234 800 000 0000" type="tel"/>
        <TextField autoCapitalize="characters" error={errors.scn} id="register-scn" label="Supreme Court Number (SCN)" name="scn" onChange={() => clearError("scn")} placeholder="SCN-123456"/>
        <SelectField disabled={branchLoading || branchLoadError || !branches.length || pending} error={branchError} hint="Your branch approves your account before you can use the app. Ask your branch secretariat if you are unsure which to choose." id="register-branch" label="NBA Branch" onChange={(value) => { setBranchCode(value); clearError("branch"); }} options={branches.map((branch) => ({ value: branch.branch_code, label: branch.name }))} placeholder={branchPlaceholder} value={branchCode}/>
        {branchLoadError ? <div className="mb-4"><Button onClick={retryBranches} variant="outline">Retry loading branches</Button></div> : null}
        <TextField autoComplete="new-password" error={errors.password} id="register-password" label="Password" onChange={(event) => { setPassword(event.target.value); clearError("password"); }} placeholder="At least 8 characters" type="password" value={password}/>
        <TextField autoComplete="new-password" error={errors.confirmation} id="register-confirm" label="Confirm Password" onChange={(event) => { setConfirmation(event.target.value); clearError("confirmation"); }} placeholder="Re-enter your password" type="password" value={confirmation}/>
        {message ? <FormMessage tone="error">{message}</FormMessage> : null}
        <Button disabled={branchLoading || branchLoadError || !branches.length} loading={pending} type="submit">Proceed</Button>
      </form>
      <div className="mt-4"><AuthFooterLink href="/login" prefix="Already have an account?" text="Log In"/></div>
    </Card>
  </AuthScreen>;
}
