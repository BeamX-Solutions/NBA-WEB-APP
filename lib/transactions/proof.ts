import { validateProof } from "../preview/documents.ts";
import { canSubmitProof } from "./contracts.ts";

export async function validateProofContent(file: File): Promise<string | null> {
  const error = validateProof(file);
  if (error) return error;
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const signatures: Record<string, number[]> = {
    "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
    "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    "image/jpeg": [0xff, 0xd8, 0xff],
  };
  if (!signatures[file.type].every((byte, index) => bytes[index] === byte)) return "The file contents do not match the selected format. Choose a valid PDF, JPG, or PNG.";
  return null;
}

export type ProofState = { status: string; proofPath: string | null };
export type ProofSubmissionPorts = {
  upload: () => Promise<boolean>;
  submit: () => Promise<{ updated: boolean; error: boolean }>;
  read: () => Promise<ProofState | null>;
  removeUnused: () => Promise<void>;
};
export type ProofSubmissionResult = { success: boolean; message: string };

export async function submitProof(initial: ProofState, path: string, ports: ProofSubmissionPorts): Promise<ProofSubmissionResult> {
  if (!canSubmitProof(initial.status)) return { success: false, message: "This transaction no longer accepts payment proof. Refresh to see its current status." };
  let uploaded = false;
  try {
    uploaded = await ports.upload();
    if (!uploaded) return { success: false, message: "The proof could not be uploaded. Check your connection and try again." };
    const result = await ports.submit();
    if (result.updated) return { success: true, message: "Proof submitted for branch verification." };
    const current = await ports.read();
    if (current?.proofPath === path && ["pending_verification", "verified"].includes(current.status)) return { success: true, message: "Proof submitted for branch verification." };
    // Only a definite zero-row update can be cleaned up. A failed response may
    // still be committing; never delete its file while that outcome is unknown.
    if (!result.error && current && current.proofPath !== path) await ports.removeUnused();
    return { success: false, message: "Submission could not be confirmed. Refresh the transaction before trying again." };
  } catch {
    return { success: false, message: uploaded ? "Submission could not be confirmed. Refresh the transaction before trying again." : "The proof could not be uploaded. Check your connection and try again." };
  }
}
