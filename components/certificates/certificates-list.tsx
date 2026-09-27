"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormNotice, type NoticeTone } from "@/components/ui/form-notice";
import { TransactionShell } from "@/components/transactions/transaction-shell";
import type { Certificate } from "@/lib/certificates/types";
import { verificationPath } from "@/lib/certificates/contracts";

type DisplayMode = "grid" | "list";
const focusClass = "focus-visible:outline-[3px] focus-visible:outline-nba-focus focus-visible:outline-offset-2";

function ViewIcon({ mode }: { mode: DisplayMode }) {
  return mode === "grid" ? <svg aria-hidden="true" fill="none" height="19" viewBox="0 0 24 24" width="19"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" stroke="currentColor" strokeWidth="2"/></svg> : <svg aria-hidden="true" fill="currentColor" height="19" viewBox="0 0 24 24" width="19"><path d="M2 3h4v4H2zm6 0h14v4H8zM2 10h4v4H2zm6 0h14v4H8zM2 17h4v4H2zm6 0h14v4H8z"/></svg>;
}

function ShareIcon() {
  return <svg aria-hidden="true" fill="none" height="23" viewBox="0 0 24 24" width="23"><circle cx="18" cy="5" fill="currentColor" r="2.5"/><circle cx="6" cy="12" fill="currentColor" r="2.5"/><circle cx="18" cy="19" fill="currentColor" r="2.5"/><path d="m8 11 8-5M8 13l8 5" stroke="currentColor" strokeWidth="2"/></svg>;
}

function CertificateCard({ certificate, mode, onShare }: { certificate: Certificate; mode: DisplayMode; onShare: (certificate: Certificate) => void }) {
  const rbinSegments = certificate.rbin.split("/");
  const rbinPrefix = rbinSegments.length > 2 ? `${rbinSegments.slice(0, -2).join("/")}/` : "";
  const rbinSuffix = rbinSegments.slice(-2).join("/");
  return <article className="min-w-0 rounded-[14px] border border-[#e0e2e2] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.03)] min-[800px]:p-5">
    {mode === "grid" ? <div className="relative grid h-[155px] place-content-center justify-items-center rounded-[10px] bg-[#e9f8f0] text-[#155c3a] min-[800px]:h-[190px]"><svg aria-hidden="true" fill="none" height="45" viewBox="0 0 48 48" width="45"><circle cx="24" cy="19" r="13" stroke="currentColor" strokeWidth="3"/><path d="M16 30v15l8-4 8 4V30" fill="currentColor"/><path d="m24 10 2.5 6h6l-5 4 2 6-5.5-3.5L18.5 26l2-6-5-4h6z" fill="currentColor"/></svg><strong className="mt-3 text-[13px]">Certificate of Compliance</strong><span className="absolute right-2 bottom-2 rounded-full bg-[#242424] px-2 py-1 text-[10px] font-bold text-white">{certificate.revoked ? "REVOKED" : "ISSUED"}</span></div> : null}
    <div className={`${mode === "grid" ? "mt-4" : ""} flex items-start justify-between gap-3`}><span className="rounded-full bg-[#f3f5f4] px-3 py-[7px] text-[12px] font-semibold text-[#65707e]">{certificate.year}</span><span className="rounded-full bg-[#e9f8f0] px-3 py-[7px] text-[12px] font-semibold text-[#1e7651]">{certificate.revoked ? "Revoked" : "Issued"}</span></div>
    <h2 className="mt-5 text-[21px] leading-[1.25] font-bold min-[800px]:text-[23px]">Certificate of Compliance</h2>
    {mode === "grid" ? <p className="mt-2 text-[16px] text-[#66717e]">{certificate.documentType}</p> : null}
    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-[10px] bg-[#f4f6f5] p-3 text-[13px]"><div className="min-w-0"><dt className="text-[#66717e]">RBIN</dt><dd className="mt-1 font-semibold leading-[1.5] text-[#155c3a]"><span className="inline-block max-w-full break-all">{rbinPrefix}</span><span className="inline-block max-w-full break-all">{rbinSuffix}</span></dd></div><div><dt className="text-[#66717e]">Date Issued</dt><dd className="mt-1 font-semibold text-[#155c3a]">{certificate.issuedAt}</dd></div></dl>
    <div className="mt-4 flex gap-2"><Link className={`grid min-h-[54px] min-w-0 flex-1 place-items-center rounded-[10px] bg-[#0d5b38] px-3 text-center text-[16px] font-semibold text-white ${focusClass}`} href={`/certificates/${certificate.id}`}>View Certificate</Link><button aria-label={`Share certificate ${certificate.rbin}`} className={`grid size-[54px] shrink-0 place-items-center rounded-[10px] border border-[#dce1df] bg-white text-[#0d5b38] ${focusClass}`} onClick={() => onShare(certificate)} type="button"><ShareIcon/></button></div>
  </article>;
}

export function CertificatesList({ certificates, error, loading = false }: { certificates: Certificate[]; error: string | null; loading?: boolean }) {
  const router = useRouter();
  const [messageTone, setMessageTone] = useState<NoticeTone>("success");
  const [mode, setMode] = useState<DisplayMode>("grid");
  const [message, setMessage] = useState("");

  async function share(certificate: Certificate) {
    const url = new URL(verificationPath(certificate.rbin), window.location.origin).href;
    setMessage("");
    setMessageTone("success");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Certificate verification", text: `Verify certificate ${certificate.rbin}.`, url });
        setMessage("Verification link shared.");
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Verification link copied.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessageTone("error");
      setMessage("Could not share the verification link. Please try again.");
    }
  }

  return <TransactionShell activeNavigation="certificates" showNavigation><main className="mx-auto max-w-[1080px] px-4 pt-6 pb-[calc(100px+env(safe-area-inset-bottom))] min-[800px]:px-7 min-[800px]:pt-10">
    <h1 className="font-serif text-[29px] leading-[1.2] font-bold min-[800px]:text-[39px]">My Certificates</h1>
    <p className="mt-2 max-w-[700px] text-[16px] leading-[1.45] text-[#66717e]">View and download your official Certificates of Compliance.</p>
    <div aria-label="Certificate display" className="mt-5 inline-flex rounded-[10px] bg-[#f4f6f5] p-1" role="group">{(["grid", "list"] as const).map((item) => <button aria-pressed={mode === item} className={`flex min-h-[42px] items-center gap-2 rounded-[8px] border-0 px-4 text-[16px] ${focusClass} ${mode === item ? "bg-white font-semibold text-[#24272a] shadow-sm" : "bg-transparent text-[#66717e]"}`} key={item} onClick={() => setMode(item)} type="button"><ViewIcon mode={item}/>{item === "grid" ? "Grid" : "List"}</button>)}</div>
    <div aria-live="polite" className={`mt-5 grid gap-4 ${mode === "grid" ? "min-[800px]:grid-cols-2" : ""}`}>{loading ? <FormNotice tone="info">Loading your certificates…</FormNotice> : error ? <div><FormNotice tone="error">{error}</FormNotice><button className={`mt-4 rounded-[10px] bg-[#0d5b38] px-4 py-3 font-semibold text-white ${focusClass}`} onClick={() => router.refresh()} type="button">Try again</button></div> : certificates.length ? certificates.map((certificate) => <CertificateCard certificate={certificate} key={certificate.id} mode={mode} onShare={share}/>) : <p className="rounded-xl border border-[#e0e2e2] bg-white p-6 text-[#66717e]">No certificates have been issued to your account yet.</p>}</div>
    {message ? <div className="fixed right-4 bottom-[85px] left-4 z-30 mx-auto max-w-[450px]"><FormNotice tone={messageTone}>{message}</FormNotice></div> : null}
  </main></TransactionShell>;
}
