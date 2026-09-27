"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { TransactionShell } from "@/components/transactions/transaction-shell";
import { FormNotice, type NoticeTone } from "@/components/ui/form-notice";
import { verificationPath as certificateVerificationPath } from "@/lib/certificates/contracts";
import type { Certificate } from "@/lib/certificates/types";
import { downloadPdf } from "@/lib/preview/documents";

const fields: readonly [string, keyof Certificate][] = [
  ["NAME OF LAWYER", "practitioner"],
  ["RBIN", "rbin"],
  ["SUPREME COURT NUMBER", "scn"],
  ["PARTIES TO THE DOCUMENT", "parties"],
  ["TYPE OF DOCUMENT", "documentType"],
  ["CONSIDERATION", "consideration"],
];

export function CertificateDetail({ certificate, pdfAvailable }: { certificate: Certificate; pdfAvailable: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<NoticeTone>("error");
  const [downloading, setDownloading] = useState(false);
  const verificationPath = certificateVerificationPath(certificate.rbin);

  useEffect(() => {
    if (!canvasRef.current) return;
    const url = new URL(verificationPath, window.location.origin).href;
    let active = true;
    QRCode.toCanvas(canvasRef.current, url, { width: 112, margin: 0, color: { dark: "#193b2b", light: "#fffdf6" } }).catch(() => { if (active) { setStatusTone("error"); setStatus("Could not draw the verification QR code. Use the verification link below."); } });
    return () => { active = false; };
  }, [verificationPath]);

  async function download() {
    if (!pdfAvailable || downloading) return;
    setDownloading(true);
    setStatus("");
    try {
      const response = await fetch(`/certificates/${certificate.id}/pdf`, { cache: "no-store" });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("application/pdf")) {
        setStatusTone("error");
        setStatus(response.status === 409 ? "This certificate is revoked and cannot be downloaded." : "The certificate PDF is unavailable. Please contact your branch administrator.");
        return;
      }
      const pdf = await response.blob();
      downloadPdf(pdf, `certificate-${certificate.id}.pdf`);
      setStatusTone("success");
      setStatus("Certificate PDF downloaded.");
    } catch {
      setStatusTone("error");
      setStatus("Could not download the certificate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return <TransactionShell><main className="mx-auto max-w-[900px] px-4 pt-5 pb-12 min-[800px]:px-7 min-[800px]:pt-8">
    <article aria-label="Certificate of Compliance" className="relative border-[3px] border-[#b38b37] bg-[#fffcf5] p-[5px] text-[#18392b] shadow-sm">
      <span className="absolute top-[6px] right-[10px] bg-[#fffcf5] px-1 text-[10px] font-bold tracking-wide text-[#805b20]">{certificate.revoked ? "REVOKED" : "ISSUED"}</span>
      <div className="border border-[#cdb980] px-4 py-5 min-[800px]:px-12 min-[800px]:py-12">
        <header className="flex items-center gap-3"><Image alt="Nigerian Bar Association seal" className="size-[48px] shrink-0 object-contain min-[800px]:size-[80px]" height={80} src="/nba-seal.png" width={80}/><div><p className="font-serif text-[15px] leading-[1.15] font-bold min-[800px]:text-[30px]">NIGERIAN BAR ASSOCIATION</p><p className="mt-2 text-[11px] font-bold tracking-[.2em] min-[800px]:text-[17px]">{certificate.branch}</p></div></header>
        <div className="mt-4 border-t border-[#b38b37] pt-4 text-center"><h1 className="font-serif text-[27px] leading-[1.07] font-bold min-[800px]:text-[42px]">CERTIFICATE OF<br/>COMPLIANCE</h1></div>
        <div className="mt-4 border-t border-[#b38b37] pt-4 text-center"><p className="text-[13px] tracking-[.15em] italic min-[800px]:text-[19px]">THIS IS TO CERTIFY THAT</p><p className="mx-auto mt-4 max-w-[670px] text-[14px] leading-[1.7] min-[800px]:text-[19px]">The undersigned Legal Practitioner whose particulars appear below has duly prepared the title document as described herein in accordance with the Rules of Professional Conduct, the Legal Practitioners Act and the Branch Remuneration Order.</p></div>
        <dl className="mt-4">{fields.map(([label, key], index) => <div className="border-b border-[#d8cba6] py-3" key={key}><dt className="text-[11px] font-bold tracking-[.08em] text-[#53645d] min-[800px]:text-[15px]">{index + 1}. {label}</dt><dd className="mt-2 break-words text-[17px] leading-[1.35] font-bold min-[800px]:text-[22px]">{certificate[key]}</dd></div>)}</dl>
        <p className="mt-7 text-center text-[14px] leading-[1.65] italic text-[#45534c] min-[800px]:text-[17px]">This Certificate is issued as evidence of compliance with the Branch Remuneration Order and for record purposes.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-[13px] min-[800px]:text-[16px]"><div><strong className="block text-[#53645d]">Date of Issue</strong><span className="mt-1 block">{certificate.issuedAt}</span></div><div><strong className="block text-[#53645d]">Certificate No.</strong><span className="mt-1 block break-all">{certificate.certificateNumber}</span></div></div>
        <div className="mt-8 flex items-end justify-between gap-3"><div className="text-center"><canvas aria-label="Certificate verification QR code" className="mx-auto size-[112px] max-w-full" ref={canvasRef} role="img"/><p className="mt-1 text-[11px] tracking-wider text-[#53645d]">Scan to verify</p></div><div className="min-w-0 max-w-[55%] border-t border-[#18392b] pt-2 text-right text-[12px] min-[800px]:text-[16px]"><strong className="block">{certificate.chairman}</strong><span className="block tracking-widest">CHAIRMAN</span><span className="block tracking-wider">{/^NBA\b/i.test(certificate.branch) ? certificate.branch : `NBA ${certificate.branch}`}</span></div></div>
      </div>
    </article>
    <section className="mt-5 rounded-[14px] border border-[#e9be55] bg-[#fff8de] p-4 text-[#6f571e] min-[800px]:p-6"><h2 className="border-b border-[#e6d8ae] pb-3 font-serif text-[23px] font-bold text-[#175b3b]">▦ Verification</h2><p className="mt-4 text-[15px] leading-[1.5]">Scan the QR code or open the link below to check the certificate’s current status in the NBA registry.</p><Link className="mt-5 block break-all font-semibold text-[#155c3a] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-nba-focus" href={verificationPath}>{verificationPath}</Link></section>
    {certificate.revoked ? <FormNotice className="mt-5" tone="error">This certificate has been revoked and is no longer valid.{certificate.revocationReason ? ` Reason: ${certificate.revocationReason}` : ""}</FormNotice> : !pdfAvailable ? <FormNotice className="mt-5" tone="info">The official PDF is not available yet. Please contact your branch administrator.</FormNotice> : null}
    <button className="mt-5 min-h-[56px] w-full rounded-[11px] border-0 bg-[#0d5b38] px-4 text-[18px] font-semibold text-white focus-visible:outline-[3px] focus-visible:outline-nba-focus focus-visible:outline-offset-2 disabled:opacity-60" disabled={downloading || !pdfAvailable} onClick={download} type="button">{downloading ? "Downloading PDF…" : certificate.revoked ? "Certificate Revoked" : !pdfAvailable ? "PDF Unavailable" : "Download PDF"}</button>
    <Link className="mt-6 inline-block text-sm font-semibold text-[#0d5b38] focus-visible:outline-2 focus-visible:outline-nba-focus" href="/certificates">← My Certificates</Link>
    {status ? <FormNotice className="mt-3" tone={statusTone}>{status}</FormNotice> : null}
  </main></TransactionShell>;
}
