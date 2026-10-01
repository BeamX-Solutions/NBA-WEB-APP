import { GateBody, GateScreen } from "@/components/membership/gate-screen";
import { ButtonLink } from "@/components/mobile/button";
import { ADMINISTRATOR_LOGIN_PATH } from "@/lib/practitioner/access";

/**
 * mobile components/ui/AdminWebOnly, shown after the administrator's session has been ended, so it
 * needs none and sits outside proxy. A person who both administers a branch and practises holds two
 * accounts; create_transaction refuses an administrator whatever this page does.
 */
export default function AdministratorAccountPage() {
  return <GateScreen icon="desktop-windows" title="Administrators use the web console">
    <GateBody>This account administers a branch, so it does not carry a practitioner surface. Verification and certificate issuance happen on the web console, on a screen wide enough to show a payment proof beside the submission it belongs to.</GateBody>
    <GateBody>If you also practise, sign in with your practitioner account instead. The two are deliberately kept separate, so that no one approves their own submission.</GateBody>
    <div className="mt-6"><ButtonLink href={ADMINISTRATOR_LOGIN_PATH} variant="outline">Back to log in</ButtonLink></div>
  </GateScreen>;
}
