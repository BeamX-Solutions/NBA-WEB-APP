import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { loadPdfAssets } from "./assets.ts";
import { createCertificatePdf, type CertificatePdfData } from "./certificate-pdf.ts";
import { createInvoicePdf, type InvoicePdfData } from "./invoice-pdf.ts";

async function assertSingleA4(blob: Blob): Promise<void> {
  const pdf = await PDFDocument.load(await blob.arrayBuffer());
  assert.equal(pdf.getPageCount(), 1);
  const page = pdf.getPage(0);
  assert.ok(Math.abs(page.getWidth() - 595.28) < 0.01);
  assert.ok(Math.abs(page.getHeight() - 841.89) < 0.01);
}

const invoice: InvoicePdfData = {
  invoiceNumber: "TXN-00042-DOA", issuedOn: "30 September 2026", practitioner: "Test Practitioner", scn: "SCN/TEST",
  parties: "Chinedu Okafor to Adeola Properties Ltd", documentType: "Deed of Assignment", amountPayable: "₦5,500,000",
  branchFee: "₦110,000", branchName: "NBA Anaocha Branch", accountName: "NBA Anaocha Branch", accountNumber: "0123456789", bankName: "Zenith Bank",
};

const certificate: CertificatePdfData = {
  practitioner: "Test Practitioner", rbin: "NBA/AN/2026/00042", scn: "SCN/TEST", parties: "A very long list of parties ".repeat(6).trim(),
  documentType: "Deed of Assignment", consideration: "₦60,000,000", certificateNumber: "NBA/AN/CC/2026/0042", issuedOn: "30 September 2026",
  branch: "NBA Anaocha Branch", chairman: "Test Chairman", signature: null, revoked: false,
  verificationUrl: "https://nba-mobile-app.vercel.app/verify/NBA%2FAN%2F2026%2F00042",
};

test("invoice renders as one A4 page, with or without branch bank details", async () => {
  const assets = await loadPdfAssets();
  await assertSingleA4(await createInvoicePdf(invoice, assets));
  await assertSingleA4(await createInvoicePdf({ ...invoice, accountName: null, accountNumber: null, bankName: null }, assets));
});

test("certificate renders as one A4 page, revoked or not, with a signature image or without", async () => {
  const assets = await loadPdfAssets();
  await assertSingleA4(await createCertificatePdf(certificate, assets));
  await assertSingleA4(await createCertificatePdf({ ...certificate, revoked: true, chairman: null, signature: assets.seal }, assets));
});

test("an unreadable signature falls back to the printed name rather than failing", async () => {
  const assets = await loadPdfAssets();
  await assertSingleA4(await createCertificatePdf({ ...certificate, signature: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]) }, assets));
});

test("a certificate without a full verification URL is refused", async () => {
  await assert.rejects(createCertificatePdf({ ...certificate, verificationUrl: "/verify/NBA" }, await loadPdfAssets()));
});
