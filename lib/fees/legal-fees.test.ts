import assert from "node:assert/strict";
import test from "node:test";
import { calculateLegalFee, DOCUMENT_TYPES, formatNaira, parseNairaToKobo, type FeeCategory } from "./legal-fees.ts";

const cases: [FeeCategory, string, string][] = [
  ["conveyancing", "1,500,000", "₦150,000"],
  ["conveyancing", "50,000,000", "₦5,000,000"],
  ["conveyancing", "75,000,000", "₦6,250,000"],
  ["conveyancing", "100,000,000", "₦7,500,000"],
  ["conveyancing", "150,000,000", "₦9,000,000"],
  ["mortgage", "30,000,000", "₦1,200,000"],
  ["mortgage", "50,000,000", "₦2,000,000"],
  ["mortgage", "80,000,000", "₦2,900,000"],
  ["mortgage", "100,000,000", "₦3,500,000"],
  ["mortgage", "150,000,000", "₦5,500,000"],
  ["tenancy", "3,000,000", "₦300,000"],
  ["tenancy", "5,000,000", "₦500,000"],
  ["tenancy", "8,000,000", "₦650,000"],
  ["tenancy", "10,000,000", "₦750,000"],
  ["tenancy", "12,000,000", "₦850,000"],
];

for (const [category, input, expected] of cases) {
  test(`${category} ${input} computes ${expected}`, () => {
    const parsed = parseNairaToKobo(input);
    assert.notEqual(parsed, null);
    assert.equal(formatNaira(calculateLegalFee(category, parsed!).primaryFeeKobo), expected);
  });
}

test("Scale 4A mortgage >₦100m bracket uses the Order's quoted ₦4.5m base", () => {
  const atBoundary = calculateLegalFee("mortgage", 10_000_000_000n);
  const aboveBoundary = calculateLegalFee("mortgage", 10_000_000_100n);
  assert.equal(formatNaira(atBoundary.primaryFeeKobo), "₦3,500,000");
  assert.equal(formatNaira(aboveBoundary.primaryFeeKobo), "₦4,500,000.02");
});

test("sub lease uses annual rental Scale 4B and POA needs transaction classification", () => {
  const sublease = DOCUMENT_TYPES.find((document) => document.id === "deed-of-sub-lease");
  const poa = DOCUMENT_TYPES.find((document) => document.id === "irrevocable-power-of-attorney");
  assert.equal(sublease?.category, "tenancy");
  assert.equal(poa?.requiresPropertyTransfer, true);
  assert.equal(formatNaira(calculateLegalFee(sublease!.category, 800_000_000n).primaryFeeKobo), "₦650,000");
});

test("reference breakdown keeps counterparty fee separate from total", () => {
  const result = calculateLegalFee("conveyancing", 150_000_000n);
  assert.equal(formatNaira(result.counterpartyFeeKobo), "₦75,000");
  assert.equal(formatNaira(result.branchLevyKobo), "₦30,000");
  assert.equal(formatNaira(result.totalKobo), "₦180,000");
});

test("conveyance reference matches the supplied ₦15 million breakdown", () => {
  const result = calculateLegalFee("conveyancing", 1_500_000_000n);
  assert.equal(formatNaira(result.primaryFeeKobo), "₦1,500,000");
  assert.equal(formatNaira(result.counterpartyFeeKobo), "₦750,000");
  assert.equal(formatNaira(result.branchLevyKobo), "₦30,000");
  assert.equal(formatNaira(result.totalKobo), "₦1,530,000");
});

test("input parser rejects unsafe and invalid amounts", () => {
  for (const input of ["", "0", "-1", "abc", "1.234", "1e6", "1,000,000,000,000.01"]) {
    assert.equal(parseNairaToKobo(input), null, input);
  }
  assert.equal(parseNairaToKobo("1,500.25"), 150_025n);
});
