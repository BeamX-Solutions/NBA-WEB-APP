import Link from "next/link";
import { FormNotice } from "@/components/ui/form-notice";
import { decodeRbinSegment } from "@/lib/certificates/contracts";
import { verifyCertificate } from "@/lib/certificates/verification";

export const dynamic = "force-dynamic";

export default async function VerificationPage({ params }: { params: Promise<{ rbin: string }> }) {
  const { rbin } = await params;
  const reference = decodeRbinSegment(rbin);
  const { record, error } = await verifyCertificate(reference ?? "");
  const fields = record ? [["Practitioner", record.practitioner], ["Supreme Court Number", record.scn], ["Branch", record.branch], ["Document", record.documentType], ["Date issued", record.issuedAt], ["Certificate number", record.certificateNumber]] : [];
  return <main className="mx-auto max-w-xl px-5 py-16 text-[#26362f]">
    <h1 className="font-serif text-3xl font-bold">Certificate verification</h1>
    <FormNotice className="mt-6" tone={error || record?.revoked ? "error" : record ? "success" : "info"}>{error ?? (record ? record.revoked ? "This certificate has been revoked and is no longer valid." : "This certificate is recorded as issued and has not been revoked." : "No issued certificate was found for this RBIN. Check the reference and try again.")}</FormNotice>
    <p className="mt-6 text-sm text-[#66717e]">Reference checked: <span className="break-all font-semibold text-[#17392b]">{record?.rbin ?? reference ?? rbin}</span></p>
    {record ? <dl className="mt-6 text-sm">{fields.map(([label, value]) => <div className="border-b border-[#e0e2e2] py-3" key={label}><dt className="text-[#66717e]">{label}</dt><dd className="mt-1 break-words font-semibold text-[#17392b]">{value}</dd></div>)}</dl> : null}
    <Link className="mt-8 inline-block rounded-lg bg-[#0d5b38] px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-nba-focus" href="/certificates">Back to My Certificates</Link>
  </main>;
}
