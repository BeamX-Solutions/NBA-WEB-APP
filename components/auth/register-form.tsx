"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import { AuthField, AuthSeal, AuthStatus, AuthSwitchLink } from "./auth-ui";
import { BranchPicker } from "./branch-picker";

export function RegisterForm() {
  const [branch, setBranch] = useState("");
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchError, setBranchError] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const branchTrigger = useRef<HTMLButtonElement>(null);
  const confirmationInput = useRef<HTMLInputElement>(null);

  const closeBranch = useCallback(() => {
    setBranchOpen(false);
    requestAnimationFrame(() => branchTrigger.current?.focus());
  }, []);

  function selectBranch(value: string) {
    setBranch(value);
    setBranchError(false);
    closeBranch();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!branch) {
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

    setPassword("");
    setConfirmation("");
    setMessage("Registration is unavailable until Supabase authentication and the branch list are configured. No account was created.");
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
                onClick={() => setBranchOpen(true)}
                ref={branchTrigger}
                type="button"
              >
                <span className={branch ? "" : "auth-placeholder"}>{branch || "Select your branch"}</span>
                <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="m5 9 7 7 7-7" /></svg>
              </button>
              {branchError ? <p className="auth-error" id="register-branch-error">Select a branch.</p> : null}
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
            <button className="auth-submit" type="submit">Proceed</button>
            {message ? <AuthStatus>{message}</AuthStatus> : null}
          </form>
          <AuthSwitchLink href="/login" prefix="Already have an account?" text="Log In" />
        </section>
      </div>
      {branchOpen ? <BranchPicker onClose={closeBranch} onSelect={selectBranch} /> : null}
    </main>
  );
}
