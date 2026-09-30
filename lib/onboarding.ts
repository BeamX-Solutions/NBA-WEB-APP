/**
 * Whether the onboarding slides have been seen, stored on the device under mobile's key. It describes
 * "has this browser used the app", not the account, and must work before anyone signs in.
 */
export const ONBOARDING_KEY = "onboarding.seen.v1";

type FlagStorage = Pick<Storage, "getItem" | "setItem">;

/** A storage failure must not lock anyone out, so it counts as already seen. */
export function hasSeenOnboarding(storage: FlagStorage | undefined): boolean {
  try {
    return storage?.getItem(ONBOARDING_KEY) === "true" || storage === undefined;
  } catch {
    return true;
  }
}

/** Losing the flag only means the slides show again next time. */
export function markOnboardingSeen(storage: FlagStorage | undefined): void {
  try {
    storage?.setItem(ONBOARDING_KEY, "true");
  } catch {
    // Nothing to do: the slides simply show again.
  }
}

export type Slide = { image: string; title: string; body: string };

/** mobile app/onboarding.tsx, word for word. The photographs are Unsplash, licensed for this use. */
export const slides: readonly Slide[] = [
  { image: "/onboarding/onboarding-calculate.jpg", title: "Calculate the prescribed minimum", body: "Choose the instrument and enter the amount it is charged on: the consideration, the loan, or one year of rent. The fee is computed under the Remuneration Order, band by band, and shown in full." },
  { image: "/onboarding/onboarding-submit.jpg", title: "Your client pays the branch", body: "Generate an invoice for your client, who pays the fee into the branch account. Attach their payment slip for the branch to review. The branch keeps its 2% and sends you the rest." },
  { image: "/onboarding/onboarding-certificate.jpg", title: "Receive your Certificate of Compliance", body: "Once your branch verifies payment you are issued a Bar Association Identification Number and a Certificate of Compliance, available to download at any time." },
];
