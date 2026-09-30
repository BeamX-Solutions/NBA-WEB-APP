import { CERTIFICATE_ORDER_NAME } from "../branding.ts";

/**
 * What a Certificate of Compliance states, shared by the detail page and the PDF so the two
 * can never differ. Mirrors mobile/lib/certificate.ts; the order matches the branch's certificate.
 */

export type CertificateFacts = {
  practitioner: string;
  rbin: string;
  scn: string;
  parties: string;
  documentType: string;
  consideration: string;
};

export type Particular = { label: string; value: string };

export function certificateParticulars(facts: CertificateFacts): Particular[] {
  return [
    { label: "NAME OF LAWYER", value: facts.practitioner },
    { label: "RBIN", value: facts.rbin },
    { label: "SUPREME COURT NUMBER", value: facts.scn },
    { label: "PARTIES TO THE DOCUMENT", value: facts.parties },
    { label: "TYPE OF DOCUMENT", value: facts.documentType },
    { label: "CONSIDERATION", value: facts.consideration },
  ];
}

export const CERTIFICATE_RECITAL =
  "The undersigned Legal Practitioner whose particulars appear below has duly prepared the " +
  "title document as described herein in accordance with the Rules of Professional Conduct, " +
  `the Legal Practitioners Act and the ${CERTIFICATE_ORDER_NAME}.`;

export const CERTIFICATE_NOTE =
  `This Certificate is issued as evidence of compliance with the ${CERTIFICATE_ORDER_NAME} ` +
  "and for record purposes.";
