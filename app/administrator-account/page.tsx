import { SignOutButton } from "@/components/auth/sign-out-button";
import { GateBody, GateScreen } from "@/components/membership/gate-screen";

/**
 * mobile components/ui/AdminWebOnly. A person who both administers a branch and practises holds two
 * accounts; create_transaction refuses an administrator whatever this page does.
 */
export default function AdministratorAccountPage() {
  return <GateScreen icon="desktop-windows" title="Administrators use the web console">
    <GateBody>This account administers a branch, so it does not carry a practitioner surface. Verification and certificate issuance happen on the web console, on a screen wide enough to show a payment proof beside the submission it belongs to.</GateBody>
    <GateBody>If you also practise, sign in with your practitioner account instead. The two are deliberately kept separate, so that no one approves their own submission.</GateBody>
    <div className="mt-6"><SignOutButton/></div>
  </GateScreen>;
}
