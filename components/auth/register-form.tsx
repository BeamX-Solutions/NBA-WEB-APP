"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AuthField, AuthSeal, AuthStatus, AuthSwitchLink } from "./auth-ui";
import { BranchPicker } from "./branch-picker";
import { listSignupBranches, type SignupBranch } from "@/lib/auth/branches";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [branch, setBranch] = useState<SignupBranch | null>(null);
  const [branches, setBranches] = useState<SignupBranch[]>([]);
  const [branchLoading, setBranchLoading] = useState(true);
  const [branchLoadError, setBranchLoadError] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchError, setBranchError] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const branchTrigger = useRef<HTMLButtonElement>(null);
  const confirmationInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    listSignupBranches(createClient())
      .then((list) => { if (active) setBranches(list); })
      .catch(() => { if (active) setBranchLoadError(true); })
      .finally(() => { if (active) setBranchLoading(false); });
    return () => { active = false; };
  }, []);

  const closeBranch = useCallback(() => {
    setBranchOpen(false);
    requestAnimationFrame(() => branchTrigger.current?.focus());
  }, []);

  function selectBranch(value: SignupBranch) {
    setBranch(value);
    setBranchError(false);
    closeBranch();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!branch || !branches.some((item) => item.id === branch.id && item.branch_code === branch.branch_code)) {
      setBranchError(true);
      branchTrigger.current?.focus();
      return;
    }

    if (password !== confirmation) {
      confirmationInput.current?.setCustomValidity("Passwords do not match.");
      confirmationInput.current?.reportValidity();
      confirmationInput.current?.focus();
      return;
    }

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const phone = String(form.get("phone") ?? "").trim();
    const scn = String(form.get("scn") ?? "").trim();
    if (!fullName || !email || !phone || !scn || password.length < 8) {
      setMessage("Complete all fields and use a password of at least 8 characters.");
      return;
    }

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
      if (error) { setMessage(error.message); return; }
      setPassword("");
      setConfirmation("");
      setMessage(data.session ? "Account created. You can continue to your dashboard." : "Check your email for a confirmation link to finish registration.");
      if (data.session) { router.replace("/"); router.refresh(); }
    } catch {
      setMessage("Registration could not be completed. Please try again.");
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
          <form className="auth-form" onSubmit={submit}>
            <AuthField id="register-name" label="Full Name (As on Call to Bar Certificate)">
              <input autoComplete="name" className="auth-input" id="register-name" name="name" placeholder="e.g. Jane Doe" required type="text" />
            </AuthField>
            <AuthField id="register-email" label="Official Email Address">
              <input autoComplete="email" className="auth-input" id="register-email" name="email" placeholder="jane.doe@example.com" required type="email" />
            </AuthField>
            <AuthField id="register-phone" label="Phone Number">
              <input autoComplete="tel" className="auth-input" id="register-phone" name="phone" placeholder="+234 800 000 0000" required type="tel" />
            </AuthField>
            <AuthField id="register-scn" label="Supreme Court Number (SCN)">
              <input className="auth-input" id="register-scn" name="scn" placeholder="SCN- 123456" required type="text" />
            </AuthField>
            <AuthField hint="Ask your branch secretariat if you are unsure which to choose." id="register-branch" label="NBA Branch">
              <button
                aria-describedby={branchError ? "register-branch-error" : undefined}
                aria-expanded={branchOpen}
                aria-haspopup="dialog"
                className={`auth-input auth-branch-trigger ${branchError ? "auth-input--error" : ""}`}
                id="register-branch"
                disabled={branchLoading || branchLoadError || branches.length === 0 || pending}
                onClick={() => setBranchOpen(true)}
                ref={branchTrigger}
                type="button"
              >
                <span className={branch ? "" : "auth-placeholder"}>{branch?.name || (branchLoading ? "Loading branches…" : "Select your branch")}</span>
                <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="m5 9 7 7 7-7" /></svg>
              </button>
              {branchError ? <p className="auth-error" id="register-branch-error">Select a branch.</p> : null}
              {branchLoadError ? <p className="auth-error" role="alert">Branches could not be loaded. Refresh and try again.</p> : null}
              {!branchLoading && !branchLoadError && branches.length === 0 ? <p className="auth-error" role="alert">No branches are available for registration.</p> : null}
            </AuthField>
            <AuthField id="register-password" label="Password">
              <input autoComplete="new-password" className="auth-input" id="register-password" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required type="password" value={password} />
            </AuthField>
            <AuthField id="register-confirm" label="Confirm Password">
              <input
                autoComplete="new-password"
                className="auth-input"
                id="register-confirm"
                name="confirmation"
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  event.target.setCustomValidity("");
                }}
                placeholder="Re-enter your password"
                ref={confirmationInput}
                required
                type="password"
                value={confirmation}
              />
            </AuthField>
            <button className="auth-submit" disabled={pending || branchLoading || branchLoadError || branches.length === 0} type="submit">{pending ? "Creating account…" : "Proceed"}</button>
            {message ? <AuthStatus>{message}</AuthStatus> : null}
          </form>
          <AuthSwitchLink href="/login" prefix="Already have an account?" text="Log In" />
        </section>
      </div>
      {branchOpen ? <BranchPicker branches={branches} onClose={closeBranch} onSelect={selectBranch} /> : null}
    </main>
  );
}
