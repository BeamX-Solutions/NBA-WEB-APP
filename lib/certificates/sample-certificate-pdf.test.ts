import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { createSampleCertificatePdf } from "./sample-certificate-pdf.ts";
import { sampleCertificates, sampleVerificationPath } from "./sample-certificates.ts";

test("sample certificate exports as one A4 PDF with a local verification link", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.startsWith("data:")) return originalFetch(input, init);
    return new Response(await readFile(`public${url}`), { status: 200 });
  };
  try {
    const certificate = sampleCertificates[0];
    const path = sampleVerificationPath(certificate.rbin);
    assert.equal(path, "/verify/NBA%2FANAOCHA%2F0002%2F2026");
    const output = await createSampleCertificatePdf(certificate, `http://localhost:3000${path}`);
    const pdf = await PDFDocument.load(await output.arrayBuffer());
    assert.equal(pdf.getPageCount(), 1);
    assert.ok(Math.abs(pdf.getPage(0).getWidth() - 595.28) < 0.01);
    assert.ok(Math.abs(pdf.getPage(0).getHeight() - 841.89) < 0.01);
    assert.ok(output.size > 10_000);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("sample PDF requires an absolute verification URL", async () => {
  await assert.rejects(createSampleCertificatePdf(sampleCertificates[0], "/verify/sample"), /full verification URL/);
});
