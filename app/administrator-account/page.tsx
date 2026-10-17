import { GateBody, GateScreen } from "@/components/membership/gate-screen";
import { ButtonLink } from "@/components/mobile/button";
import { ADMINISTRATOR_LOGIN_PATH } from "@/lib/practitioner/access";

/**
 * Shown after a super administrator's session has been ended, so it needs none and sits outside
 * proxy. A branch administrator practises and is let in; create_transaction refuses a super
 * administrator whatever this page does.
 */
export default function AdministratorAccountPage() {
  return <GateScreen icon="desktop-windows" title="Super administrators use the web console">
    <GateBody>This account oversees every branch and belongs to none, so it does not carry a practitioner surface. Branches, administrators and reports are managed on the web console.</GateBody>
    <div className="mt-6"><ButtonLink href={ADMINISTRATOR_LOGIN_PATH} variant="outline">Back to log in</ButtonLink></div>
  </GateScreen>;
}
