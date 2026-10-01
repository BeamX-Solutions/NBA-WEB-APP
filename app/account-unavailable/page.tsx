import { SignOutButton } from "@/components/auth/sign-out-button";
import { GateBody, GateScreen } from "@/components/membership/gate-screen";
import { ButtonLink } from "@/components/mobile/button";

/**
 * Where proxy holds an account whose role or membership could not be read. Mobile keeps such an
 * account on its loading state; signing it out instead would log practitioners out on a passing failure.
 */
export default function AccountUnavailablePage() {
  return <GateScreen icon="error-outline" title="Account unavailable">
    <GateBody>We could not confirm your account details. Check your connection and try again. If this keeps happening, sign in again.</GateBody>
    <div className="mt-6 flex flex-col gap-3">
      <ButtonLink external href="/">Try again</ButtonLink>
      <SignOutButton/>
    </div>
  </GateScreen>;
}
