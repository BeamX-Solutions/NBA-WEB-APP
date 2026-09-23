import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { calculateLegalFee, DOCUMENT_TYPES } from "../fees/legal-fees.ts";
import { createCertificateLayoutPreviewPdf, createInvoicePdf, createTermsPdf, validateProof, validateText } from "./documents.ts";

test("required document text stays bounded", () => {
  assert.equal(validateText("  ", "Client"), "Enter client.");
  assert.equal(validateText("A".repeat(161), "Client"), "Client must be 160 characters or fewer.");
  assert.equal(validateText("Sample Client", "Client"), null);
});

test("invoice, terms, and certificate layout export at A4", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => new Response(await readFile("public" + String(url)), { status: 200 });
  try {
    const document = DOCUMENT_TYPES.find((item) => item.id === "deed-of-conveyance")!;
    const basis = { document, amountKobo: 1_500_000_000n, fee: calculateLegalFee(document.category, 1_500_000_000n) };
    const invoice = { ...basis, parties: "Chinedu Okafor to Adeola Properties Ltd", createdAt: new Date("2026-09-23T00:00:00Z") };
    const outputs = [
      await createInvoicePdf(invoice),
      await createTermsPdf(basis, "Obinna Nweke", "the sale of the property at 12 Ziks Avenue"),
      await createCertificateLayoutPreviewPdf(),
    ];
    for (const output of outputs) {
      const pdf = await PDFDocument.load(await output.arrayBuffer());
      assert.ok(pdf.getPageCount() >= 1);
      for (const page of pdf.getPages()) {
        assert.ok(Math.abs(page.getWidth() - 595.28) < 0.01);
        assert.ok(Math.abs(page.getHeight() - 841.89) < 0.01);
      }
    }
    assert.equal((await PDFDocument.load(await outputs[0].arrayBuffer())).getPageCount(), 1);
    assert.equal((await PDFDocument.load(await outputs[2].arrayBuffer())).getPageCount(), 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("proof picker accepts only supported nonempty files under 10 MB", () => {
  assert.equal(validateProof(new File(["sample"], "proof.pdf", { type: "application/pdf" })), null);
  assert.equal(validateProof(new File(["sample"], "proof.png", { type: "image/png" })), null);
  assert.match(validateProof(new File(["sample"], "proof.txt", { type: "text/plain" })) ?? "", /PDF, JPG, or PNG/);
  assert.match(validateProof(new File([], "proof.pdf", { type: "application/pdf" })) ?? "", /not empty/);
  assert.match(validateProof(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "proof.pdf", { type: "application/pdf" })) ?? "", /10 MB/);
});
