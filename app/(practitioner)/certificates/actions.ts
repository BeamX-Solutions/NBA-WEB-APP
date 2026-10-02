"use server";

import { loadCertificatePage, type CertificatePage } from "@/lib/certificates/data";
import { parseCursor } from "@/lib/paging";

/** The next page of the practitioner's certificates. A cursor that does not parse ends the list. */
export async function loadMoreCertificatesAction(cursor: unknown): Promise<CertificatePage> {
  const parsed = parseCursor(cursor);
  if (!parsed) return { certificates: [], nextCursor: null, error: null };
  return loadCertificatePage(parsed);
}
