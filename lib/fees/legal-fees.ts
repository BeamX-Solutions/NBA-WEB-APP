/** Scale 4: Legal Practitioners Remuneration (For Business, Legal Service and Representation) Order, 2023.
 * Source: https://blog.nigerianbar.org.ng/wp-content/uploads/2025/03/Legal-Practitioners-Renumeration-Order-2023.pdf
 * This pure module must also be used to verify any future server-side transaction creation.
 */

export type FeeCategory = "conveyancing" | "mortgage" | "tenancy";

export type DocumentType = {
  id: string;
  label: string;
  category: FeeCategory;
  description: string;
  requiresPropertyTransfer?: boolean;
};

export const DOCUMENT_TYPES: readonly DocumentType[] = [
  { id: "deed-of-assignment", label: "Deed of Assignment", category: "conveyancing", description: "Scale 4A - Consideration / purchase price." },
  { id: "deed-of-conveyance", label: "Deed of Conveyance", category: "conveyancing", description: "Scale 4A - Consideration / purchase price." },
  { id: "deed-of-gift", label: "Deed of Gift", category: "conveyancing", description: "Scale 4A - Property value." },
  { id: "contract-of-sale", label: "Contract of Sale", category: "conveyancing", description: "Scale 4A - Consideration / purchase price." },
  { id: "deed-of-surrender", label: "Deed of Surrender", category: "conveyancing", description: "Scale 4A - Property value." },
  { id: "deed-of-exchange", label: "Deed of Exchange", category: "conveyancing", description: "Scale 4A - Property value." },
  { id: "mortgage-deed", label: "Mortgage Deed", category: "mortgage", description: "Scale 4A - Mortgage value." },
  { id: "mortgage-release", label: "Deed of Release / Discharge of Mortgage", category: "mortgage", description: "Scale 4A - Mortgage value." },
  { id: "tenancy-agreement", label: "Tenancy Agreement", category: "tenancy", description: "Scale 4B - Annual rental value." },
  { id: "deed-of-lease", label: "Deed of Lease", category: "tenancy", description: "Scale 4B - Annual rental value." },
  { id: "deed-of-sub-lease", label: "Deed of Sub Lease", category: "tenancy", description: "Scale 4B - Annual rental value." },
  { id: "irrevocable-power-of-attorney", label: "Irrevocable Power of Attorney", category: "conveyancing", description: "Scale 4A only where the underlying transaction is a property assignment or conveyance.", requiresPropertyTransfer: true },
] as const;

export const MAX_AMOUNT_KOBO = 1_000_000_000_000_00n;

// Temporary product configuration to reproduce the supplied reference. Replace with the
// authenticated practitioner's branch payment configuration before transaction creation.
export const REFERENCE_BRANCH_LEVY_KOBO = 3_000_000n;

export type FeeLine = { label: string; amountKobo: bigint };

export type FeeBreakdown = {
  category: FeeCategory;
  primaryRole: string;
  counterpartyRole: string;
  primaryFeeKobo: bigint;
  counterpartyFeeKobo: bigint;
  branchLevyKobo: bigint;
  totalKobo: bigint;
  lines: FeeLine[];
};

export function parseNairaToKobo(input: string): bigint | null {
  const normalized = input.replaceAll(",", "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [naira, fractional = ""] = normalized.split(".");
  const amount = BigInt(naira) * 100n + BigInt(fractional.padEnd(2, "0") || "0");
  if (amount <= 0n || amount > MAX_AMOUNT_KOBO) return null;
  return amount;
}

export function formatNaira(amountKobo: bigint, decimals = false): string {
  const whole = amountKobo / 100n;
  const fraction = amountKobo % 100n;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₦${grouped}${decimals || fraction !== 0n ? `.${fraction.toString().padStart(2, "0")}` : ""}`;
}

function percentage(amountKobo: bigint, basisPoints: bigint): bigint {
  return (amountKobo * basisPoints + 5_000n) / 10_000n;
}

function tier(amount: bigint, cap: bigint): bigint {
  return amount < cap ? amount : cap;
}

export function calculateLegalFee(
  category: FeeCategory,
  amountKobo: bigint,
  branchLevyKobo = REFERENCE_BRANCH_LEVY_KOBO,
): FeeBreakdown {
  if (amountKobo <= 0n || amountKobo > MAX_AMOUNT_KOBO) throw new RangeError("Enter a valid positive amount.");
  if (branchLevyKobo < 0n) throw new RangeError("Branch levy cannot be negative.");

  let primaryRole: string;
  let counterpartyRole: string;
  let lines: FeeLine[];

  if (category === "conveyancing") {
    primaryRole = "Assignee's practitioner";
    counterpartyRole = "Assignor's practitioner (half rate)";
    const first = tier(amountKobo, 5_000_000_000n);
    const second = tier(amountKobo > first ? amountKobo - first : 0n, 5_000_000_000n);
    const third = amountKobo > 10_000_000_000n ? amountKobo - 10_000_000_000n : 0n;
    lines = [
      { label: "First ₦50,000,000 at 10%", amountKobo: percentage(first, 1_000n) },
      ...(second > 0n ? [{ label: "Next ₦50,000,000 at 5%", amountKobo: percentage(second, 500n) }] : []),
      ...(third > 0n ? [{ label: "Above ₦100,000,000 at 3%", amountKobo: percentage(third, 300n) }] : []),
    ];
  } else if (category === "mortgage") {
    primaryRole = "Mortgagee's practitioner";
    counterpartyRole = "Mortgagor's practitioner (half rate)";
    // Scale 4A explicitly quotes ₦4.5m for the first ₦100m in the >₦100m
    // bracket. This differs from the sum of the preceding bracket (₦3.5m).
    // Preserve the printed rule at the threshold rather than smoothing it.
    if (amountKobo > 10_000_000_000n) {
      lines = [
        { label: "First ₦100,000,000 (Scale 4A)", amountKobo: 450_000_000n },
        { label: "Above ₦100,000,000 at 2%", amountKobo: percentage(amountKobo - 10_000_000_000n, 200n) },
      ];
    } else {
      const first = tier(amountKobo, 5_000_000_000n);
      const second = amountKobo > first ? amountKobo - first : 0n;
      lines = [
        { label: "First ₦50,000,000 at 4%", amountKobo: percentage(first, 400n) },
        ...(second > 0n ? [{ label: "Next ₦50,000,000 at 3%", amountKobo: percentage(second, 300n) }] : []),
      ];
    }
  } else {
    primaryRole = "Lessor's / Landlord's practitioner";
    counterpartyRole = "Lessee's / Tenant's practitioner (half rate)";
    const first = tier(amountKobo, 500_000_000n);
    const remainder = amountKobo > first ? amountKobo - first : 0n;
    lines = [
      { label: "First ₦5,000,000 annual rent at 10%", amountKobo: percentage(first, 1_000n) },
      ...(remainder > 0n ? [{ label: "Remaining annual rent at 5%", amountKobo: percentage(remainder, 500n) }] : []),
    ];
  }

  const primaryFeeKobo = lines.reduce((sum, line) => sum + line.amountKobo, 0n);
  const counterpartyFeeKobo = (primaryFeeKobo + 1n) / 2n;
  return {
    category,
    primaryRole,
    counterpartyRole,
    primaryFeeKobo,
    counterpartyFeeKobo,
    branchLevyKobo,
    totalKobo: primaryFeeKobo + branchLevyKobo,
    lines,
  };
}
