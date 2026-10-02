import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { isUuid } from "@/lib/calculator/contracts";
import { asRow, canSubmitProof, text } from "@/lib/transactions/contracts";
import { submitProof, validateProofContent, type ProofState } from "@/lib/transactions/proof";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const maxBodySize = 11 * 1024 * 1024;

function json(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

function proofState(value: unknown): ProofState | null {
  const row = asRow(value);
  return row && text(row.status) ? { status: String(row.status), proofPath: text(row.proof_url) } : null;
}

async function readForm(request: Request): Promise<FormData> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBodySize) { await reader.cancel(); throw new Error("Body too large"); }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return new Response(body, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json("The upload could not be authorized. Refresh and try again.", 403);
  const { id } = await params;
  if (!isUuid(id)) return json("Transaction not found.", 404);
  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return json("Your session expired. Log in again before uploading.", 401);

  const loadState = async () => {
    const result = await client.from("transactions").select("status, proof_url").eq("id", id).eq("user_id", user.id).maybeSingle();
    return result.error ? null : proofState(result.data);
  };
  const initial = await loadState();
  if (!initial) return json("The transaction is unavailable. Refresh and try again.", 404);
  if (!canSubmitProof(initial.status)) return json("This transaction no longer accepts payment proof.", 409);
  if (Number(request.headers.get("content-length")) > maxBodySize) return json("Choose a proof no larger than 10 MB.", 413);
  let form: FormData;
  try { form = await readForm(request); }
  catch { return json("The file could not be read. Choose a proof no larger than 10 MB.", 400); }
  const file = form.get("proof");
  if (!(file instanceof File)) return json("Choose a payment proof to upload.", 400);
  const error = await validateProofContent(file);
  if (error) return json(error, 400);
  const extension = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const path = `${user.id}/${id}/${randomUUID()}.${extension}`;
  const result = await submitProof(initial, path, {
    upload: async () => !(await client.storage.from("proofs").upload(path, file, { contentType: file.type, upsert: false })).error,
    submit: async () => {
      let query = client.from("transactions").update({ proof_url: path, status: "pending_verification" }).eq("id", id).eq("user_id", user.id).eq("status", initial.status);
      query = initial.proofPath ? query.eq("proof_url", initial.proofPath) : query.is("proof_url", null);
      const response = await query.select("id").maybeSingle();
      return { updated: !response.error && response.data?.id === id, error: Boolean(response.error) };
    },
    read: loadState,
    removeUnused: async () => { await client.storage.from("proofs").remove([path]); },
  });
  if (result.success) {
    revalidatePath(`/transactions/${id}`);
    revalidatePath("/transactions");
  }
  return json(result.message, result.success ? 200 : 409);
}
