"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/mobile/button";
import { Card } from "@/components/mobile/card";
import { Icon } from "@/components/mobile/icon";
import { Screen, SectionTitle } from "@/components/mobile/screen";
import { Notice, type NoticeTone } from "@/components/mobile/states";
import { CERTIFICATE_NOTE, CERTIFICATE_RECITAL, certificateParticulars } from "@/lib/certificates/wording";
import type { Certificate } from "@/lib/certificates/types";
import { downloadPdf } from "@/lib/preview/documents";
import { useOnline } from "@/lib/use-online";

/**
 * mobile certificate/[id]. The branch's paper and gold adapted for a screen: a single gold rule rather
 * than the printed double frame, and the particulars stacked rather than tabulated. The colours are the
 * branch's document colours, deliberately not theme tokens, exactly as on mobile.
 */
export function CertificateDetail({ certificate, verificationUrl }: { certificate: Certificate; verificationUrl: string }) {
  const online = useOnline();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const particulars = certificateParticulars(certificate);

  useEffect(() => {
    if (!canvasRef.current) return;
    let active = true;
    QRCode.toCanvas(canvasRef.current, verificationUrl, { width: 78, margin: 0, color: { dark: "#14301F", light: "#FBF7EF" } }).catch(() => { if (active) setStatus({ message: "Could not draw the verification QR code. Use the verification link below.", tone: "error" }); });
    return () => { active = false; };
  }, [verificationUrl]);

  async function download() {
    if (downloading) return;
    setDownloading(true);
    setStatus(null);
    try {
      const response = await fetch(`/certificates/${certificate.id}/pdf`, { cache: "no-store" });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("application/pdf")) {
        setStatus({ message: "The PDF could not be generated. Please try again.", tone: "error" });
        return;
      }
      downloadPdf(await response.blob(), `certificate-${certificate.certificateNumber.replace(/[^A-Za-z0-9-]/g, "-")}.pdf`);
      setStatus({ message: certificate.revoked ? "Certificate PDF downloaded. It is marked REVOKED." : "Certificate PDF downloaded.", tone: "success" });
    } catch {
      setStatus({ message: "Could not download the certificate PDF. Check your connection and try again.", tone: "error" });
    } finally {
      setDownloading(false);
    }
  }

  return <Screen>
    <article aria-label="Certificate of Compliance" className="rounded-[4px] border-2 border-[#B8912F] bg-[#FBF7EF] p-[5px]">
      <div className="border border-[#CBB98C] px-4 py-6">
        <div className="flex items-center gap-3">
          <Image alt="Nigerian Bar Association seal" className="size-[54px] object-contain" height={54} src="/nba-seal.png" width={54}/>
          <div className="flex-1"><p className="font-heading text-body-lg leading-[22px] font-bold text-[#123D24]">NIGERIAN BAR ASSOCIATION</p><p className="mt-[2px] text-caption font-bold tracking-[2.5px] text-[#123D24]">{certificate.branch.replace(/^NBA\s+/i, "").toUpperCase()}</p></div>
        </div>
        <div className="my-3 h-px bg-[#B99B45]"/>
        <h1 className="m-0 text-center font-heading text-[22px] leading-[27px] font-bold tracking-[0.5px] text-[#123D24]">CERTIFICATE OF COMPLIANCE</h1>
        <div className="my-3 h-px bg-[#B99B45]"/>
        <p className="mt-1 text-center text-caption tracking-[1px] text-[#14301F] italic">THIS IS TO CERTIFY THAT</p>
        <p className="mt-2 text-center text-caption leading-[21px] text-[#14301F]">{CERTIFICATE_RECITAL}</p>
        {certificate.revoked ? <div className="mt-3 rounded-input border border-danger bg-danger-surface p-3"><p className="text-center text-label font-bold text-danger">REVOKED{certificate.revocationReason ? `: ${certificate.revocationReason}` : ""}</p></div> : null}
        <dl className="m-0">{particulars.map(({ label, value }, index) => <div className="mt-4 border-b border-[#DCD2B4] pb-1" key={label}><dt className="text-[11px] font-bold tracking-[0.6px] text-[#5C6B5B]">{index + 1}. {label}</dt><dd className="m-0 mt-[3px] wrap-break-word text-body leading-[21px] font-bold text-[#14301F]">{value}</dd></div>)}</dl>
        <p className="mt-6 text-center text-[11px] leading-[17px] text-[#40503F] italic">{CERTIFICATE_NOTE}</p>
        <div className="mt-4 flex justify-between gap-3">
          <div><p className="text-[10px] font-bold tracking-[0.5px] text-[#5C6B5B]">Date of Issue</p><p className="mt-[2px] text-caption text-[#14301F]">{certificate.issuedAt}</p></div>
          <div className="text-right"><p className="text-[10px] font-bold tracking-[0.5px] text-[#5C6B5B]">Certificate No.</p><p className="mt-[2px] break-all text-caption text-[#14301F]">{certificate.certificateNumber}</p></div>
        </div>
        <div className="mt-6 flex items-end justify-between gap-3">
          <div className="flex min-w-[78px] flex-col items-center"><canvas aria-label="Certificate verification QR code" className="size-[78px]" ref={canvasRef} role="img"/><p className="mt-1 text-[9px] tracking-[0.3px] text-[#5C6B5B]">Scan to verify</p></div>
          <div className="flex flex-1 flex-col items-end"><p className="border-t border-[#14301F] pt-1 text-label font-semibold text-[#14301F]">{certificate.chairman === "Unavailable" ? "Branch Chairman" : certificate.chairman}</p><p className="text-[10px] tracking-[0.4px] text-[#40503F]">CHAIRMAN</p><p className="text-right text-[10px] tracking-[0.4px] text-[#40503F]">{certificate.branch.toUpperCase()}</p></div>
        </div>
      </div>
    </article>

    <Card className="mt-4 border-accent bg-accent-surface">
      <SectionTitle icon="qr-code-2" underline>Verification</SectionTitle>
      <p className="text-caption leading-[17px] text-accent-text">Anyone can confirm this certificate is genuine by scanning the code above, or by looking up the RBIN at the address below. The public record shows the practitioner, document type and issue date only. It never discloses the consideration or the names of the parties.</p>
      <a className="mt-3 flex items-center gap-1 text-caption font-semibold text-primary" href={verificationUrl} rel="noopener noreferrer" target="_blank"><Icon name="open-in-new" size={18}/><span className="min-w-0 flex-1 break-all">{verificationUrl}</span></a>
    </Card>

    {certificate.revoked ? <Notice className="mt-4" tone="error">This certificate has been revoked and is no longer valid. Any PDF you download is marked REVOKED.</Notice> : null}
    <div className="mt-4"><Button disabled={!online} loading={downloading} onClick={download}>{online ? "Download PDF" : "Offline: reconnect to download"}</Button></div>
    {status ? <Notice className="mt-3" tone={status.tone}>{status.message}</Notice> : null}
  </Screen>;
}
