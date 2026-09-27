"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthField, AuthSeal, AuthStatus, AuthSwitchLink } from "./auth-ui";
import { BranchPicker } from "./branch-picker";
import { listSignupBranches, type SignupBranch } from "@/lib/auth/branches";
import { friendlyAuthError } from "@/lib/auth/errors";
import { normalizeEmail, validateRegistration, type RegisterField, type RegisterFieldErrors } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [branch, setBranch] = useState<SignupBranch | null>(null);
  const [branches, setBranches] = useState<SignupBranch[]>([]);
  const [branchLoading, setBranchLoading] = useState(true);
  const [branchLoadError, setBranchLoadError] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info" | "success">("error");
  const [pending, setPending] = useState(false);
  const branchTrigger = useRef<HTMLButtonElement>(null);
  const confirmationInput = useRef<HTMLInputElement>(null);

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

  const closeBranch = useCallback(() => {
    setBranchOpen(false);
    requestAnimationFrame(() => branchTrigger.current?.focus());
  }, []);

  function selectBranch(value: SignupBranch) {
    setBranch(value);
    clearError("branch");
    closeBranch();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("name") ?? "").trim();
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const phone = String(form.get("phone") ?? "").trim();
    const scn = String(form.get("scn") ?? "").trim();
    const validBranch = Boolean(branch && branches.some((item) => item.id === branch.id && item.branch_code === branch.branch_code));
    const nextErrors = validateRegistration({ branchSelected: validBranch, confirmation, email, fullName, password, phone, scn });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.branch) branchTrigger.current?.focus();
      else if (nextErrors.confirmation) confirmationInput.current?.focus();
      return;
    }

    if (!branch) return;
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
        setMessageTone("error");
        setMessage(friendlyAuthError(error, "register"));
        return;
      }
      setPassword("");
      setConfirmation("");
      setMessageTone(data.session ? "success" : "info");
      setMessage(data.session ? "Account created. Opening your dashboard…" : "Check your email for a confirmation link to finish registration.");
      if (data.session) {
        router.replace("/");
        router.refresh();
      }
    } catch (error) {
      setMessageTone("error");
      setMessage(friendlyAuthError(error, "register"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page auth-page--register">
      <div className="auth-register-wrap">
        <div className="auth-register-intro">
          <AuthSeal />
          <h1>Create Account</h1>
          <p>Register as a legal practitioner to access official services and fee calculators.</p>
        </div>

        <section aria-label="Create account form" className="auth-card auth-register-card">
          <form className="auth-form" noValidate onSubmit={submit}>
            <AuthField error={errors.fullName} id="register-name" label="Full Name (As on Call to Bar Certificate)">
              <input aria-describedby={errors.fullName ? "register-name-error" : undefined} aria-invalid={Boolean(errors.fullName)} autoComplete="name" className="auth-input" id="register-name" name="name" onChange={() => clearError("fullName")} placeholder="e.g. Jane Doe" type="text" />
            </AuthField>
            <AuthField error={errors.email} id="register-email" label="Official Email Address">
              <input aria-describedby={errors.email ? "register-email-error" : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" className="auth-input" id="register-email" name="email" onChange={() => clearError("email")} placeholder="jane.doe@example.com" type="email" />
            </AuthField>
            <AuthField error={errors.phone} id="register-phone" label="Phone Number">
              <input aria-describedby={errors.phone ? "register-phone-error" : undefined} aria-invalid={Boolean(errors.phone)} autoComplete="tel" className="auth-input" id="register-phone" name="phone" onChange={() => clearError("phone")} placeholder="+234 800 000 0000" type="tel" />
            </AuthField>
            <AuthField error={errors.scn} id="register-scn" label="Supreme Court Number (SCN)">
              <input aria-describedby={errors.scn ? "register-scn-error" : undefined} aria-invalid={Boolean(errors.scn)} className="auth-input" id="register-scn" name="scn" onChange={() => clearError("scn")} placeholder="SCN-123456" type="text" />
            </AuthField>
            <AuthField error={errors.branch} hint="Ask your branch secretariat if you are unsure which to choose." id="register-branch" label="NBA Branch">
              <button aria-describedby={errors.branch ? "register-branch-error" : undefined} aria-expanded={branchOpen} aria-haspopup="dialog" className={`auth-input auth-branch-trigger ${errors.branch ? "auth-input--invalid" : ""}`} disabled={branchLoading || branchLoadError || branches.length === 0 || pending} id="register-branch" onClick={() => setBranchOpen(true)} ref={branchTrigger} type="button">
                <span className={branch ? "" : "auth-placeholder"}>{branch?.name || (branchLoading ? "Loading branches…" : "Select your branch")}</span>
                <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="m5 9 7 7 7-7" /></svg>
              </button>
              {branchLoadError ? <div className="auth-retry-row"><p className="auth-error" role="alert">Branches could not be loaded.</p><button className="auth-inline-action" onClick={retryBranches} type="button">Try again</button></div> : null}
              {!branchLoading && !branchLoadError && branches.length === 0 ? <p className="auth-error" role="alert">No branches are available for registration.</p> : null}
            </AuthField>
            <AuthField error={errors.password} id="register-password" label="Password">
              <input aria-describedby={errors.password ? "register-password-error" : undefined} aria-invalid={Boolean(errors.password)} autoComplete="new-password" className="auth-input" id="register-password" name="password" onChange={(event) => { setPassword(event.target.value); clearError("password"); }} placeholder="At least 8 characters" type="password" value={password} />
            </AuthField>
            <AuthField error={errors.confirmation} id="register-confirm" label="Confirm Password">
              <input aria-describedby={errors.confirmation ? "register-confirm-error" : undefined} aria-invalid={Boolean(errors.confirmation)} autoComplete="new-password" className="auth-input" id="register-confirm" name="confirmation" onChange={(event) => { setConfirmation(event.target.value); clearError("confirmation"); }} placeholder="Re-enter your password" ref={confirmationInput} type="password" value={confirmation} />
            </AuthField>
            <button className="auth-submit" disabled={pending || branchLoading || branchLoadError || branches.length === 0} type="submit">{pending ? "Creating account…" : "Proceed"}</button>
            {message ? <AuthStatus tone={messageTone}>{message}</AuthStatus> : null}
          </form>
          <AuthSwitchLink href="/login" prefix="Already have an account?" text="Log In" />
        </section>
      </div>
      {branchOpen ? <BranchPicker branches={branches} onClose={closeBranch} onSelect={selectBranch} /> : null}
    </main>
  );
}
