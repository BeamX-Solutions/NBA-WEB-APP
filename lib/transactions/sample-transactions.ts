export type TransactionStatus = "awaiting" | "pending" | "verified" | "rejected";

export type SampleTransaction = {
  id: string;
  documentType: string;
  date: string;
  status: TransactionStatus;
  parties: string;
  consideration: string;
  professionalFee: string;
  practitioner: string;
  scn: string;
  rbin?: string;
  rejectionReason?: string;
};

export const statusLabels: Record<TransactionStatus, string> = {
  awaiting: "Awaiting Payment",
  pending: "Pending Verification",
  verified: "Verified",
  rejected: "Rejected",
};

// Illustrative records only. No payment, verification, or certificate exists for these IDs.
export const sampleTransactions: readonly SampleTransaction[] = [
  { id: "TXN-00009-DOC", documentType: "Deed of Conveyance", date: "22/09/2026", status: "pending", parties: "Chimaobi", consideration: "₦15,000,000", professionalFee: "₦30,000", practitioner: "Adaeze Okonkwo", scn: "SCN/2015/041287" },
  { id: "TXN-00008-DOG", documentType: "Deed of Gift", date: "22/09/2026", status: "pending", parties: "Ibeh Chimaobi", consideration: "₦6,500,000", professionalFee: "₦13,000", practitioner: "Adaeze Okonkwo", scn: "SCN/2015/041287" },
  { id: "TXN-00007-DOA", documentType: "Deed of Assignment", date: "22/09/2026", status: "pending", parties: "Chinedu Okafor to Ibeh Chimaobi", consideration: "₦35,000,000", professionalFee: "₦350,000", practitioner: "Adaeze Okonkwo", scn: "SCN/2015/041287" },
  { id: "TXN-00006-DOC", documentType: "Deed of Conveyance", date: "21/09/2026", status: "awaiting", parties: "Chimaobi’s", consideration: "₦15,008,665", professionalFee: "₦30,017.33", practitioner: "Adaeze Okonkwo", scn: "SCN/2015/041287" },
  { id: "TXN-00002-DOA", documentType: "Deed of Assignment", date: "20/09/2026", status: "verified", parties: "Chinedu Okafor to Ibeh Chimaobi", consideration: "₦35,000,000", professionalFee: "₦350,000", practitioner: "Adaeze Okonkwo", scn: "SCN/2015/041287", rbin: "NBA/ANAOCHA/0002/2026" },
  { id: "TXN-00001-DOG", documentType: "Deed of Gift", date: "19/09/2026", status: "rejected", parties: "Ibeh Chimaobi", consideration: "₦6,500,000", professionalFee: "₦13,000", practitioner: "Adaeze Okonkwo", scn: "SCN/2015/041287", rejectionReason: "The sample payment image is unclear. Select a clearer file to preview resubmission." },
];

export function findSampleTransaction(id: string): SampleTransaction | undefined {
  return sampleTransactions.find((transaction) => transaction.id === id);
}
