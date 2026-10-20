import { NextResponse } from "next/server";
import { isUuid } from "@/lib/calculator/contracts";
import { asRow, text } from "@/lib/transactions/contracts";
import { createClient } from "@/lib/supabase/server";

const noStore = { "Cache-Control": "private, no-store" };

function missing() {
  return new NextResponse("This receipt is not available.", { status: 404, headers: noStore });
}

/**
 * The bank's receipt for the transfer that paid one of the practitioner's invoices.
 *
 * The bucket is private because a receipt carries account numbers. This checks the invoice is the
 * signed-in user's, then redirects to a ten minute signed link minted for this request only.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return missing();
  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/payments")}`, request.url), { headers: noStore });

  // Owner filter is explicit: RLS would also let a branch administrator read the whole branch.
  const result = await client.from("transactions").select("payouts(receipt_path)").eq("id", id).eq("user_id", user.id).maybeSingle();
  const path = result.error ? null : text(asRow(asRow(result.data)?.payouts)?.receipt_path);
  if (!path) return missing();

  const signed = await client.storage.from("payout-receipts").createSignedUrl(path, 600);
  if (signed.error || !signed.data) return missing();
  return NextResponse.redirect(signed.data.signedUrl, { headers: noStore });
}
