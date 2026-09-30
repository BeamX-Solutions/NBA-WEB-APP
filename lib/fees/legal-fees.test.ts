import assert from "node:assert/strict";
import test from "node:test";
import { branchFeeFor, calculateLegalFee, DOCUMENT_TYPES, FeeCalculationError, formatNaira, groupNairaInput, parseNairaToKobo, type DocumentType } from "./legal-fees.ts";

// Cases and expected figures are carried over from mobile/lib/fees/calculate.test.ts,
// so the web and mobile engines are pinned to the same answers.

const NAIRA = 100n;

function documentById(id: string): DocumentType {
  const document = DOCUMENT_TYPES.find((item) => item.id === id);
  assert.ok(document, id);
  return document;
}

function feeFor(id: string, naira: bigint): bigint {
  return calculateLegalFee(documentById(id), naira * NAIRA).professionalFeeKobo;
}

/** Expected fee in kobo from a naira figure that may carry a fraction, rounded half up. */
function kobo(naira: string): bigint {
  const [whole, fraction = ""] = naira.split(".");
  const hundredths = BigInt(whole) * 10_000n + BigInt((fraction + "0000").slice(0, 4));
  return (hundredths + 50n) / 100n;
}

const scaleCases: [string, string, bigint, string][] = [
  ["4A well below the first boundary", "deed-of-assignment", 1_000_000n, "100000"],
  ["4A just below ₦50M", "deed-of-assignment", 49_999_999n, "4999999.9"],
  ["4A exactly ₦50M", "deed-of-assignment", 50_000_000n, "5000000"],
  ["4A just above ₦50M", "deed-of-assignment", 50_000_001n, "5000000.05"],
  ["4A midway through the second band", "deed-of-assignment", 75_000_000n, "6250000"],
  ["4A exactly ₦100M", "deed-of-assignment", 100_000_000n, "7500000"],
  ["4A just above ₦100M", "deed-of-assignment", 100_000_001n, "7500000.03"],
  ["4A well above ₦100M", "deed-of-assignment", 250_000_000n, "12000000"],
  ["4B below ₦50M", "mortgage-deed", 10_000_000n, "400000"],
  ["4B exactly ₦50M", "mortgage-deed", 50_000_000n, "2000000"],
  ["4B just above ₦50M", "mortgage-deed", 50_000_001n, "2000000.03"],
  ["4B exactly ₦100M", "mortgage-deed", 100_000_000n, "3500000"],
  ["4B above ₦100M", "mortgage-deed", 200_000_000n, "5500000"],
  ["4C below ₦5M", "tenancy-agreement", 1_200_000n, "120000"],
  ["4C exactly ₦5M", "tenancy-agreement", 5_000_000n, "500000"],
  ["4C just above ₦5M", "tenancy-agreement", 5_000_001n, "500000.05"],
  ["4C exactly ₦10M", "tenancy-agreement", 10_000_000n, "750000"],
  ["4C above ₦10M", "tenancy-agreement", 20_000_000n, "1250000"],
];

for (const [label, id, naira, expected] of scaleCases) {
  test(`${label}: ₦${naira} gives ₦${expected}`, () => {
    assert.equal(feeFor(id, naira), kobo(expected));
  });
}

test("every 4A document type is charged identically", () => {
  for (const id of ["deed-of-assignment", "deed-of-conveyance", "deed-of-gift", "contract-of-sale", "deed-of-surrender", "deed-of-exchange"]) {
    assert.equal(feeFor(id, 60_000_000n), 5_500_000n * NAIRA, id);
  }
});

test("Scale 4B does not jump by ₦1,000,000 at ₦100M", () => {
  const at = feeFor("mortgage-deed", 100_000_000n);
  const above = feeFor("mortgage-deed", 100_000_001n);
  assert.equal(at, 3_500_000n * NAIRA);
  assert.ok(above - at <= 10n * NAIRA);
});

test("SUSPECT: the Scale 4C ₦10M boundary is inert because both bands charge 5%", () => {
  assert.equal(feeFor("tenancy-agreement", 10_000_001n) - feeFor("tenancy-agreement", 9_999_999n), 10n);
});

test("sub-lease is charged on annual rent under Scale 4C", () => {
  const sublease = documentById("deed-of-sub-lease");
  assert.equal(sublease.scale, "4C");
  assert.equal(sublease.basisLabel, "Annual rental value");
  assert.equal(formatNaira(calculateLegalFee(sublease, 800_000_000n).professionalFeeKobo), "₦650,000");
});

test("marginal bands are summed, not one rate on the whole amount", () => {
  assert.equal(feeFor("deed-of-assignment", 60_000_000n), 5_500_000n * NAIRA);
});

test("every Scale 4A boundary is continuous", () => {
  for (const boundary of [50_000_000n, 100_000_000n]) {
    const below = feeFor("deed-of-assignment", boundary - 1n);
    const at = feeFor("deed-of-assignment", boundary);
    const above = feeFor("deed-of-assignment", boundary + 1n);
    assert.ok(at - below <= 10n * NAIRA);
    assert.ok(above - at <= 10n * NAIRA);
  }
});

test("the fee increases monotonically", () => {
  let previous = -1n;
  for (let naira = 2_500_000n; naira <= 200_000_000n; naira += 2_500_000n) {
    const fee = feeFor("deed-of-assignment", naira);
    assert.ok(fee >= previous);
    previous = fee;
  }
});

test("shows its working, one line per band crossed", () => {
  const result = calculateLegalFee(documentById("deed-of-assignment"), 150_000_000n * NAIRA);
  assert.deepEqual(result.lines.map((line) => line.amountKobo), [5_000_000n * NAIRA, 2_500_000n * NAIRA, 1_500_000n * NAIRA]);
  assert.deepEqual(result.lines.map((line) => line.label), ["First ₦50,000,000 at 10%", "₦50,000,000 to ₦100,000,000 at 5%", "Above ₦100,000,000 at 3%"]);
  assert.equal(result.lines.reduce((sum, line) => sum + line.amountKobo, 0n), result.professionalFeeKobo);
});

test("half rate is half the scale fee, and null without a counterpart", () => {
  const assignment = calculateLegalFee(documentById("deed-of-assignment"), 60_000_000n * NAIRA);
  assert.equal(assignment.halfRateFeeKobo, 2_750_000n * NAIRA);
  assert.equal(calculateLegalFee(documentById("deed-of-exchange"), 10_000_000n * NAIRA).halfRateFeeKobo, null);
});

test("Power of Attorney refuses to calculate and cites paragraph 2", () => {
  assert.throws(() => calculateLegalFee(documentById("irrevocable-power-of-attorney"), 10_000_000n * NAIRA), (error) => error instanceof FeeCalculationError && /paragraph 2/.test(error.message));
});

test("the branch fee comes out of the professional fee rather than on top of it", () => {
  const result = calculateLegalFee(documentById("deed-of-assignment"), 60_000_000n * NAIRA);
  assert.equal(result.professionalFeeKobo, 5_500_000n * NAIRA);
  assert.equal(result.branchFeeKobo, 110_000n * NAIRA);
  assert.equal(result.netFeeKobo, 5_390_000n * NAIRA);
  assert.equal(result.netFeeKobo + result.branchFeeKobo, result.professionalFeeKobo);
});

test("branch fee rounds to the nearest kobo, halves up, like public.branch_fee_for", () => {
  assert.equal(branchFeeFor(100_000n), 2_000n);
  assert.equal(branchFeeFor(25n), 1n);
  assert.equal(branchFeeFor(24n), 0n);
  assert.equal(branchFeeFor(0n), 0n);
});

test("amount input is grouped as it is typed and still parses", () => {
  assert.equal(groupNairaInput("45000000"), "45,000,000");
  assert.equal(groupNairaInput("₦45,000,000.00"), "45,000,000.00");
  assert.equal(groupNairaInput("1234."), "1,234.");
  assert.equal(groupNairaInput("1.2.3.4"), "1.23");
  assert.equal(groupNairaInput("007"), "7");
  assert.equal(groupNairaInput("0.5"), "0.5");
  assert.equal(parseNairaToKobo(groupNairaInput("45000000.5")), 4_500_000_050n);
});

test("input parser rejects unsafe and invalid amounts", () => {
  for (const input of ["", "0", "-1", "abc", "1.234", "1e6", "1,000,000,000,000.01"]) {
    assert.equal(parseNairaToKobo(input), null, input);
  }
  assert.equal(parseNairaToKobo("1,500.25"), 150_025n);
});
