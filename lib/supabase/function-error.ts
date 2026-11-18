import "server-only";

/** An Edge Function's error body carries a message written for the practitioner: { error }. */
export async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    const body = await context.json().catch(() => null) as { error?: unknown } | null;
    if (typeof body?.error === "string" && body.error.length > 0) return body.error;
  }
  return fallback;
}
