"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { TransactionShell } from "@/components/transactions/transaction-shell";
import { createSampleCertificatePdf } from "@/lib/certificates/sample-certificate-pdf";
import { sampleVerificationPath, type SampleCertificate } from "@/lib/certificates/sample-certificates";
import { downloadPdf } from "@/lib/preview/documents";

const fields: readonly [string, keyof SampleCertificate][] = [
  ["NAME OF LAWYER", "practitioner"],
  ["RBIN", "rbin"],
  ["SUPREME COURT NUMBER", "scn"],
  ["PARTIES TO THE DOCUMENT", "parties"],
  ["TYPE OF DOCUMENT", "documentType"],
  ["CONSIDERATION", "consideration"],
];

export function CertificateDetail({ certificate }: { certificate: SampleCertificate }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const verificationPath = sampleVerificationPath(certificate.rbin);

  useEffect(() => {
    if (!canvasRef.current) return;
    const url = new URL(verificationPath, window.location.origin).href;
    QRCode.toCanvas(canvasRef.current, url, { width: 112, margin: 0, color: { dark: "#193b2b", light: "#fffdf6" } }).catch(() => setStatus("Could not draw the sample QR code."));
  }, [verificationPath]);

  async function download() {
    setDownloading(true);
    setStatus("");
    try {
      const url = new URL(verificationPath, window.location.origin).href;
      const pdf = await createSampleCertificatePdf(certificate, url);
      downloadPdf(pdf, `sample-certificate-${certificate.id}.pdf`);
      setStatus("Sample PDF downloaded. It is not an issued certificate.");
    } catch {
      setStatus("Could not prepare the sample PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return <TransactionShell><main className="mx-auto max-w-[900px] px-4 pt-5 pb-12 min-[800px]:px-7 min-[800px]:pt-8">
    <article aria-label="Sample Certificate of Compliance" className="relative border-[3px] border-[#b38b37] bg-[#fffcf5] p-[5px] text-[#18392b] shadow-sm">
      <span className="absolute top-[6px] right-[10px] bg-[#fffcf5] px-1 text-[10px] font-bold tracking-wide text-[#805b20]">SAMPLE · NOT ISSUED</span>
      <div className="border border-[#cdb980] px-4 py-5 min-[800px]:px-12 min-[800px]:py-12">
        <header className="flex items-center gap-3"><Image alt="Nigerian Bar Association seal" className="size-[48px] shrink-0 object-contain min-[800px]:size-[80px]" height={80} src="/nba-seal.png" width={80}/><div><p className="font-serif text-[15px] leading-[1.15] font-bold min-[800px]:text-[30px]">NIGERIAN BAR ASSOCIATION</p><p className="mt-2 text-[11px] font-bold tracking-[.2em] min-[800px]:text-[17px]">{certificate.branch}</p></div></header>
        <div className="mt-4 border-t border-[#b38b37] pt-4 text-center"><h1 className="font-serif text-[27px] leading-[1.07] font-bold min-[800px]:text-[42px]">CERTIFICATE OF<br/>COMPLIANCE</h1></div>
        <div className="mt-4 border-t border-[#b38b37] pt-4 text-center"><p className="text-[13px] tracking-[.15em] italic min-[800px]:text-[19px]">THIS IS TO CERTIFY THAT</p><p className="mx-auto mt-4 max-w-[670px] text-[14px] leading-[1.7] min-[800px]:text-[19px]">The undersigned Legal Practitioner whose particulars appear below has duly prepared the title document as described herein in accordance with the Rules of Professional Conduct, the Legal Practitioners Act and the Branch Remuneration Order.</p></div>
        <dl className="mt-4">{fields.map(([label, key], index) => <div className="border-b border-[#d8cba6] py-3" key={key}><dt className="text-[11px] font-bold tracking-[.08em] text-[#53645d] min-[800px]:text-[15px]">{index + 1}. {label}</dt><dd className="mt-2 break-words text-[17px] leading-[1.35] font-bold min-[800px]:text-[22px]">{certificate[key]}</dd></div>)}</dl>
        <p className="mt-7 text-center text-[14px] leading-[1.65] italic text-[#45534c] min-[800px]:text-[17px]">This Certificate is issued as evidence of compliance with the Branch Remuneration Order and for record purposes.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-[13px] min-[800px]:text-[16px]"><div><strong className="block text-[#53645d]">Date of Issue</strong><span className="mt-1 block">{certificate.issuedAt}</span></div><div><strong className="block text-[#53645d]">Certificate No.</strong><span className="mt-1 block break-all">{certificate.certificateNumber}</span></div></div>
        <div className="mt-8 flex items-end justify-between gap-3"><div className="text-center"><canvas aria-label="Sample verification QR code" className="mx-auto size-[112px] max-w-full" ref={canvasRef} role="img"/><p className="mt-1 text-[11px] tracking-wider text-[#53645d]">Scan to verify</p></div><div className="min-w-0 max-w-[55%] border-t border-[#18392b] pt-2 text-right text-[12px] min-[800px]:text-[16px]"><strong className="block">{certificate.chairman}</strong><span className="block tracking-widest">CHAIRMAN</span><span className="block tracking-wider">NBA {certificate.branch}</span></div></div>
      </div>
    </article>
    <section className="mt-5 rounded-[14px] border border-[#e9be55] bg-[#fff8de] p-4 text-[#6f571e] min-[800px]:p-6"><h2 className="border-b border-[#e6d8ae] pb-3 font-serif text-[23px] font-bold text-[#175b3b]">▦ Verification</h2><p className="mt-4 text-[15px] leading-[1.5]">This sample QR opens a demo page. This app has no authoritative registry and cannot confirm whether a certificate is genuine. A public record must never disclose the consideration or parties.</p><Link className="mt-5 block break-all font-semibold text-[#155c3a] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-nba-focus" href={verificationPath}>{verificationPath}</Link></section>
    <button className="mt-5 min-h-[56px] w-full rounded-[11px] border-0 bg-[#0d5b38] px-4 text-[18px] font-semibold text-white focus-visible:outline-[3px] focus-visible:outline-nba-focus focus-visible:outline-offset-2 disabled:opacity-60" disabled={downloading} onClick={download} type="button">{downloading ? "Preparing sample PDF…" : "Download Sample PDF"}</button>
    <Link className="mt-6 inline-block text-sm font-semibold text-[#0d5b38] focus-visible:outline-2 focus-visible:outline-nba-focus" href="/certificates">← My Certificates</Link>
    {status ? <p aria-live="polite" className="mt-3 text-center text-sm text-[#53645d]" role="status">{status}</p> : null}
  </main></TransactionShell>;
}
