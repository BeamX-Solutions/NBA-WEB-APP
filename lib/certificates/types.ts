export type Certificate = {
  id: string;
  year: string;
  rbin: string;
  certificateNumber: string;
  issuedAt: string;
  documentType: string;
  practitioner: string;
  scn: string;
  parties: string;
  consideration: string;
  branch: string;
  chairman: string;
  revoked: boolean;
  revocationReason: string | null;
  pdfUrl: string | null;
};

export type VerificationRecord = Pick<Certificate, "rbin" | "certificateNumber" | "issuedAt" | "documentType" | "practitioner" | "scn" | "branch" | "revoked" | "revocationReason">;
