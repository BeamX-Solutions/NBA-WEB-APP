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
  /** Null on transactions drawn before the field existed. */
  propertyDescription: string | null;
  consideration: string;
  /** Set where the fee was agreed with the client (a Power of Attorney), never for a Scale 4 fee. */
  feeBasis: string | null;
  branch: string;
  chairman: string;
  /** Path in the private `signatures` bucket, or null where the branch has uploaded none. */
  chairmanSignaturePath: string | null;
  revoked: boolean;
  revocationReason: string | null;
  /** Issued from a demo branch: a specimen that certifies nothing. */
  isDemo: boolean;
};

export type VerificationRecord = Pick<Certificate, "rbin" | "certificateNumber" | "issuedAt" | "documentType" | "practitioner" | "scn" | "branch" | "revoked" | "revocationReason" | "isDemo">;
