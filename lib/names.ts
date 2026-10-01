/**
 * Greeting helpers, ported from mobile/lib/names.ts. Names are registered as on the Call to Bar
 * certificate, often with a title ("Barr. Oluwaseun Adebayo"), so recognised honorifics are skipped.
 */
const HONORIFICS = new Set(["barr", "barrister", "mr", "mrs", "miss", "ms", "dr", "chief", "prof", "professor", "sir", "lady", "hon", "honourable", "esq", "san"]);

function normalise(word: string): string {
  return word.toLowerCase().replace(/\.+$/, "");
}

/** First name suitable for a greeting, or null when there is none. */
export function firstNameOf(fullName: string | null | undefined): string | null {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return words.find((word) => !HONORIFICS.has(normalise(word))) ?? null;
}

/** Time-of-day greeting for an hour from 0 to 23. */
export function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
