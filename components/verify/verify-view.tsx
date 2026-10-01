import Image from "next/image";
import { buttonClass } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { controlClass, inputClass } from "@/components/mobile/control";
import { Icon } from "@/components/mobile/icon";
import { DetailList, DetailRow, Screen, ScreenHeading } from "@/components/mobile/screen";
import { ErrorState } from "@/components/mobile/states";
import { ATTRIBUTION, PRODUCT_NAME } from "@/lib/branding";
import type { VerificationRecord } from "@/lib/certificates/types";

export type VerifyOutcome =
  | { kind: "idle" }
  | { kind: "found"; record: VerificationRecord }
  | { kind: "notFound" }
  | { kind: "error" };

function Banner({ good, children }: { good: boolean; children: string }) {
  return <div className={`mb-3 flex items-center gap-2 rounded-input p-3 ${good ? "bg-success-surface text-primary" : "bg-danger-surface text-danger"}`}><Icon name={good ? "verified" : "gpp-bad"} size={28}/><span className="text-body-lg font-bold">{children}</span></div>;
}

function Result({ outcome }: { outcome: VerifyOutcome }) {
  if (outcome.kind === "idle") return null;
  if (outcome.kind === "error") return <ErrorState body="The register could not be reached. This does not mean the certificate is invalid." title="Something went wrong"/>;
  if (outcome.kind === "notFound") {
    return <Card className="mt-4"><Banner good={false}>No such certificate</Banner><p className="mb-3 text-body leading-[21px] text-text">No issued certificate carries this RBIN. Check the number for transcription errors, particularly the year. If it is correct as printed, the document should not be relied on and the issuing branch should be contacted.</p></Card>;
  }
  const { record } = outcome;
  return <Card className="mt-4">
    <Banner good={!record.revoked}>{record.revoked ? "Certificate revoked" : "Genuine certificate"}</Banner>
    {record.revoked ? <p className="mb-3 text-body leading-[21px] text-text">This certificate was issued but has since been revoked{record.revocationReason ? `: ${record.revocationReason}` : "."} It should not be relied on.</p> : null}
    <DetailList>
      <DetailRow emphasise label="RBIN" value={record.rbin}/>
      <DetailRow label="Certificate Number" value={record.certificateNumber}/>
      <DetailRow label="Practitioner" value={record.practitioner}/>
      <DetailRow label="Supreme Court Number" value={record.scn}/>
      <DetailRow label="Document Type" value={record.documentType}/>
      <DetailRow label="Issuing Branch" value={record.branch}/>
      <DetailRow label="Date of Issue" value={record.issuedAt}/>
    </DetailList>
    <p className="mt-4 text-caption leading-[17px] text-text-muted">This confirms that the certificate was issued by the branch shown, to the practitioner shown, on the date shown. The consideration and the names of the parties are not disclosed. It is not confirmation that any fee was correctly assessed.</p>
  </Card>;
}

/** mobile verify/[rbin]. Works without JavaScript: the form is a GET that lands on the QR code's URL. */
export function VerifyView({ initial, outcome }: { initial: string; outcome: VerifyOutcome }) {
  return <Screen>
    <div className="mb-3 flex justify-center"><Image alt="Nigerian Bar Association seal" className="size-[60px] object-contain" height={60} priority src="/nba-seal.png" width={60}/></div>
    <ScreenHeading subtitle="Enter the Bar Association Identification Number printed on a Certificate of Compliance." title="Verify a Certificate"/>
    <Card>
      <form action="/verify" method="get">
        <div className="mb-4">
          <label className="mb-2 block text-label font-semibold text-text" htmlFor="verify-rbin">RBIN</label>
          <div className={controlClass()}><input autoCapitalize="characters" autoComplete="off" className={inputClass} defaultValue={initial} id="verify-rbin" maxLength={200} name="rbin" placeholder="NBA/2026/00042" required spellCheck={false}/></div>
        </div>
        <button className={buttonClass("primary")} type="submit">Verify</button>
      </form>
    </Card>
    <Result outcome={outcome}/>
    <p className="mt-6 text-center text-caption text-text-muted">{PRODUCT_NAME} - {ATTRIBUTION}</p>
  </Screen>;
}
