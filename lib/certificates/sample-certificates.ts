export type SampleCertificate = {
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
};

// Visual fixtures only. No certificate has been issued or verified in this app.
export const sampleCertificates: readonly SampleCertificate[] = [
  {
    id: "sample-0002",
    year: "2026",
    rbin: "NBA/ANAOCHA/0002/2026",
    certificateNumber: "NBA/AN/CC/2026/00002",
    issuedAt: "04/09/2026",
    documentType: "Deed of Assignment",
    practitioner: "Adaeze Okonkwo",
    scn: "SCN/2015/041287",
    parties: "Chinedu Okafor to Ibeh Chimaobi",
    consideration: "₦35,000,000",
    branch: "ANAOCHA BRANCH",
    chairman: "Barr. Charles Dioha",
  },
  {
    id: "sample-0001",
    year: "2026",
    rbin: "NBA/ANAOCHA/0001/2026",
    certificateNumber: "NBA/AN/CC/2026/00001",
    issuedAt: "04/09/2026",
    documentType: "Deed of Gift",
    practitioner: "Adaeze Okonkwo",
    scn: "SCN/2015/041287",
    parties: "Ibeh Chimaobi",
    consideration: "₦6,500,000",
    branch: "ANAOCHA BRANCH",
    chairman: "Barr. Charles Dioha",
  },
];

export function findSampleCertificate(id: string): SampleCertificate | undefined {
  return sampleCertificates.find((certificate) => certificate.id === id);
}

export function sampleVerificationPath(rbin: string): string {
  return `/verify/${encodeURIComponent(rbin)}`;
}
