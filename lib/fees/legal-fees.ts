/** Scale 4: Legal Practitioners (Remuneration for Business, Legal Services and Representation) Order, 2023.
 * Ported from the practitioner mobile app (mobile/lib/fees), which is the source of truth, so both
 * clients quote the same figure for the same transaction. Bands are marginal and summed exactly in
 * kobo, then rounded once, half up. This pure module also verifies server-side transaction creation.
 */

export type ScaleCode = "4A" | "4B" | "4C";

export type DocumentType = {
  id: string;
  label: string;
  scale: ScaleCode | "discretionary";
  description: string;
  basisLabel: string;
  fullRateParty: string;
  halfRateParty: string | null;
};

export const DOCUMENT_TYPES: readonly DocumentType[] = [
  { id: "deed-of-assignment", label: "Deed of Assignment", scale: "4A", description: "Scale 4A - Consideration / purchase price.", basisLabel: "Consideration / purchase price", fullRateParty: "Assignee's practitioner", halfRateParty: "Assignor's practitioner" },
  { id: "deed-of-conveyance", label: "Deed of Conveyance", scale: "4A", description: "Scale 4A - Consideration / purchase price.", basisLabel: "Consideration / purchase price", fullRateParty: "Purchaser's practitioner", halfRateParty: "Vendor's practitioner" },
  { id: "deed-of-gift", label: "Deed of Gift", scale: "4A", description: "Scale 4A - Market value of the property.", basisLabel: "Market value of the property", fullRateParty: "Donee's practitioner", halfRateParty: "Donor's practitioner" },
  { id: "contract-of-sale", label: "Contract of Sale", scale: "4A", description: "Scale 4A - Purchase price.", basisLabel: "Purchase price", fullRateParty: "Purchaser's practitioner", halfRateParty: "Vendor's practitioner" },
  { id: "deed-of-surrender", label: "Deed of Surrender", scale: "4A", description: "Scale 4A - Value of the unexpired lease interest.", basisLabel: "Value of the unexpired lease interest", fullRateParty: "Practitioner assessing the surrendered interest", halfRateParty: null },
  { id: "deed-of-exchange", label: "Deed of Exchange", scale: "4A", description: "Scale 4A - Higher of the two property values.", basisLabel: "Higher of the two property values", fullRateParty: "Each party's practitioner, charged separately", halfRateParty: null },
  { id: "mortgage-deed", label: "Mortgage Deed", scale: "4B", description: "Scale 4B - Principal loan amount.", basisLabel: "Principal loan amount", fullRateParty: "Mortgagee's practitioner", halfRateParty: "Mortgagor's practitioner" },
  { id: "mortgage-release", label: "Deed of Release / Discharge of Mortgage", scale: "4B", description: "Scale 4B - Original loan amount being discharged.", basisLabel: "Original loan amount being discharged", fullRateParty: "Mortgagee's practitioner", halfRateParty: "Mortgagor's practitioner" },
  { id: "tenancy-agreement", label: "Tenancy Agreement", scale: "4C", description: "Scale 4C - Annual rental value.", basisLabel: "Annual rental value", fullRateParty: "Landlord's practitioner", halfRateParty: "Tenant's practitioner" },
  { id: "deed-of-lease", label: "Deed of Lease", scale: "4C", description: "Scale 4C - Annual rental value.", basisLabel: "Annual rental value", fullRateParty: "Lessor's practitioner", halfRateParty: "Lessee's practitioner" },
  { id: "deed-of-sub-lease", label: "Deed of Sub-Lease", scale: "4C", description: "Scale 4C - Annual rental value.", basisLabel: "Annual rental value", fullRateParty: "Sub-Lessor's practitioner", halfRateParty: "Sub-Lessee's practitioner" },
  { id: "irrevocable-power-of-attorney", label: "Irrevocable Power of Attorney", scale: "discretionary", description: "Not covered by Scale 4. The fee is agreed with the client.", basisLabel: "Not applicable", fullRateParty: "Agreed with the client", halfRateParty: null },
] as const;

export const MAX_AMOUNT_KOBO = 1_000_000_000_000_00n;

/** Mirrors public.branch_fee_for and mobile BRANCH_SHARE_PERCENTAGE. Change all three together. */
export const BRANCH_SHARE_PERCENT = 2n;

const MILLION_KOBO = 100_000_000n;

type Band = { minKobo: bigint; maxKobo: bigint | null; percent: bigint };

const SCALE_BANDS: Record<ScaleCode, readonly Band[]> = {
  // Conveyancing and assignments.
  "4A": [
    { minKobo: 0n, maxKobo: 50n * MILLION_KOBO, percent: 10n },
    { minKobo: 50n * MILLION_KOBO, maxKobo: 100n * MILLION_KOBO, percent: 5n },
    { minKobo: 100n * MILLION_KOBO, maxKobo: null, percent: 3n },
  ],
  // Mortgages. Continuous at ₦100M; the portal's ₦1,000,000 jump there is corrected, as on mobile.
  "4B": [
    { minKobo: 0n, maxKobo: 50n * MILLION_KOBO, percent: 4n },
    { minKobo: 50n * MILLION_KOBO, maxKobo: 100n * MILLION_KOBO, percent: 3n },
    { minKobo: 100n * MILLION_KOBO, maxKobo: null, percent: 2n },
  ],
  // Leases and tenancies, on annual rent. The inert ₦10M boundary is reproduced from mobile, marked SUSPECT there.
  "4C": [
    { minKobo: 0n, maxKobo: 5n * MILLION_KOBO, percent: 10n },
    { minKobo: 5n * MILLION_KOBO, maxKobo: 10n * MILLION_KOBO, percent: 5n },
    { minKobo: 10n * MILLION_KOBO, maxKobo: null, percent: 5n },
  ],
};

export type FeeLine = { label: string; amountKobo: bigint };

export type FeeBreakdown = {
  scale: ScaleCode;
  /** Prescribed minimum for the full-rate practitioner: what the client pays into the branch account. */
  professionalFeeKobo: bigint;
  /** Half the scale fee for the other party's practitioner, or null where there is none. */
  halfRateFeeKobo: bigint | null;
  /** What the branch keeps out of the professional fee. */
  branchFeeKobo: bigint;
  /** What the branch sends on to the practitioner. */
  netFeeKobo: bigint;
  lines: FeeLine[];
};

/** Thrown when no trustworthy figure exists. Never return zero in its place. */
export class FeeCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeeCalculationError";
  }
}

export function parseNairaToKobo(input: string): bigint | null {
  const normalized = input.replaceAll(",", "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [naira, fractional = ""] = normalized.split(".");
  const amount = BigInt(naira) * 100n + BigInt(fractional.padEnd(2, "0") || "0");
  if (amount <= 0n || amount > MAX_AMOUNT_KOBO) return null;
  return amount;
}

/**
 * Groups a currency field's text as it is typed (45000000 reads 45,000,000), as mobile's
 * groupNairaInput does. Permissive so partial entries survive; the result always parses.
 */
export function groupNairaInput(input: string): string {
  const cleaned = input.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  const whole = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
  const fraction = firstDot === -1 ? null : cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
  const grouped = whole.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === null ? grouped : `${grouped}.${fraction}`;
}

export function formatNaira(amountKobo: bigint, decimals = false): string {
  const whole = amountKobo / 100n;
  const fraction = amountKobo % 100n;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₦${grouped}${decimals || fraction !== 0n ? `.${fraction.toString().padStart(2, "0")}` : ""}`;
}

/** Divides a non-negative value by 100, rounding half up. */
function roundHundredths(value: bigint): bigint {
  return (value + 50n) / 100n;
}

export function branchFeeFor(professionalFeeKobo: bigint): bigint {
  return roundHundredths(professionalFeeKobo * BRANCH_SHARE_PERCENT);
}

function describeBand(band: Band, isFirst: boolean): string {
  if (isFirst) {
    return band.maxKobo === null ? `All of the amount at ${band.percent}%` : `First ${formatNaira(band.maxKobo)} at ${band.percent}%`;
  }
  if (band.maxKobo === null) return `Above ${formatNaira(band.minKobo)} at ${band.percent}%`;
  return `${formatNaira(band.minKobo)} to ${formatNaira(band.maxKobo)} at ${band.percent}%`;
}

export function calculateLegalFee(document: DocumentType, amountKobo: bigint): FeeBreakdown {
  if (document.scale === "discretionary") {
    throw new FeeCalculationError(
      `${document.label} is not covered by Scale 4. The fee is agreed with the client under paragraph 2 of the Order, having regard to complexity, time and value.`,
    );
  }
  if (amountKobo <= 0n || amountKobo > MAX_AMOUNT_KOBO) throw new RangeError("Enter a valid positive amount.");

  const lines: FeeLine[] = [];
  let totalHundredths = 0n;
  SCALE_BANDS[document.scale].forEach((band, index) => {
    if (amountKobo <= band.minKobo) return;
    const upper = band.maxKobo === null || amountKobo < band.maxKobo ? amountKobo : band.maxKobo;
    const hundredths = (upper - band.minKobo) * band.percent;
    totalHundredths += hundredths;
    lines.push({ label: describeBand(band, index === 0), amountKobo: roundHundredths(hundredths) });
  });

  const professionalFeeKobo = roundHundredths(totalHundredths);
  const branchFeeKobo = branchFeeFor(professionalFeeKobo);
  return {
    scale: document.scale,
    professionalFeeKobo,
    halfRateFeeKobo: document.halfRateParty === null ? null : (professionalFeeKobo + 1n) / 2n,
    branchFeeKobo,
    netFeeKobo: professionalFeeKobo - branchFeeKobo,
    lines,
  };
}
