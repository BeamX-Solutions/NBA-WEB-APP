import Link from "next/link";

export default async function VerificationPage({ params }: { params: Promise<{ rbin: string }> }) {
  const { rbin } = await params;
  let displayRbin = rbin;
  try { displayRbin = decodeURIComponent(rbin); } catch { /* Keep the original input visible. */ }
  return <main className="mx-auto max-w-xl px-5 py-16 text-[#26362f]">
    <h1 className="font-serif text-3xl font-bold">Certificate verification</h1>
    <p className="mt-6 rounded-xl border border-[#e8d692] bg-[#fff8dd] p-5 leading-relaxed">This app is a local interface preview. It has no authoritative certificate registry, so it cannot confirm whether an RBIN is valid.</p>
    <p className="mt-6 text-sm text-[#66717e]">Reference checked: <span className="break-all font-semibold text-[#17392b]">{displayRbin}</span></p>
    <Link className="mt-8 inline-block rounded-lg bg-[#0d5b38] px-5 py-3 font-semibold text-white" href="/certificates">Back to sample certificates</Link>
  </main>;
}
