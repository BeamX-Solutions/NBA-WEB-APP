"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type SecurityActionState } from "@/app/profile/security/actions";
import { ProfileCard, ProfileFrame, ProfileHeading, ProfileIcon, inputClass, primaryButton } from "@/components/profile/profile-ui";
import { FormNotice } from "@/components/ui/form-notice";

type ProfileSecurityProps = {
  account: {
    email: string;
    lastSignedIn: string;
  };
};

const initialSecurityActionState: SecurityActionState = { fieldErrors: {}, message: "", status: "idle" };

export function ProfileSecurity({ account }: ProfileSecurityProps) {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialSecurityActionState);
  const fieldErrors = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
  }, [state.status]);

  return (
    <ProfileFrame>
      <ProfileHeading description="Review your account and keep your sign-in secure." title="Security" />
      <div className="mx-auto max-w-[760px] space-y-4">
        <ProfileCard icon={<ProfileIcon kind="account" />} title="Account details">
          <dl className="divide-y divide-[#eceeee]">
            <div className="py-3 first:pt-0">
              <dt className="text-[12px] uppercase tracking-[.06em] text-[#66717e]">Email address</dt>
              <dd className="mt-1 break-all text-[16px]">{account.email}</dd>
            </div>
            <div className="py-3 last:pb-0">
              <dt className="text-[12px] uppercase tracking-[.06em] text-[#66717e]">Last signed in</dt>
              <dd className="mt-1 text-[16px]">{account.lastSignedIn}</dd>
            </div>
          </dl>
        </ProfileCard>

        <ProfileCard icon={<ProfileIcon kind="lock" />} title="Change password">
          <form action={formAction} className="space-y-4" noValidate ref={formRef}>
            <PasswordField
              error={fieldErrors.currentPassword}
              id="currentPassword"
              label="Current password"
            />
            <PasswordField
              error={fieldErrors.password}
              help="Use at least 8 characters, including a number."
              id="password"
              label="New password"
            />
            <PasswordField
              error={fieldErrors.confirmation}
              id="confirmation"
              label="Confirm new password"
            />
            {state.message ? <FormNotice tone={state.status === "success" ? "success" : "error"}>{state.message}</FormNotice> : null}
            <button className={primaryButton} disabled={pending} type="submit">
              {pending ? "Updating password…" : "Update password"}
            </button>
          </form>
        </ProfileCard>
      </div>
    </ProfileFrame>
  );
}

function PasswordField({ error, help, id, label }: {
  error?: string;
  help?: string;
  id: string;
  label: string;
}) {
  const descriptionId = error ? `${id}-error` : help ? `${id}-help` : undefined;
  return (
    <div>
      <label className="mb-2 block text-[14px] font-semibold" htmlFor={id}>{label}</label>
      <input
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        autoComplete={id === "currentPassword" ? "current-password" : "new-password"}
        className={`${inputClass} ${error ? "border-[#b91c1c] ring-2 ring-[#b91c1c]/10" : ""}`}
        id={id}
        name={id}
        type="password"
      />
      {error ? <p className="auth-error" id={`${id}-error`}>{error}</p> : help ? <p className="mt-2 text-xs text-[#66717e]" id={`${id}-help`}>{help}</p> : null}
    </div>
  );
}
