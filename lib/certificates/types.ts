export type Certificate = {
  id: string;
  year: string;
  rbin: string;
  certificateNumber: string;
  /** Short date for screens, e.g. 04/09/2026. */
  issuedAt: string;
  /** Long date for the printed certificate, e.g. 4 September 2026. */
  issuedOn: string;
  documentType: string;
  practitioner: string;
  scn: string;
  parties: string;
  consideration: string;
  branch: string;
  chairman: string;
  /** Path in the private `signatures` bucket, or null where the branch has uploaded none. */
  chairmanSignaturePath: string | null;
  revoked: boolean;
  revocationReason: string | null;
};

export type VerificationRecord = Pick<Certificate, "rbin" | "certificateNumber" | "issuedAt" | "documentType" | "practitioner" | "scn" | "branch" | "revoked" | "revocationReason">;
