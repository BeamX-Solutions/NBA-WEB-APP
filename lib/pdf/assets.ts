import { readFile } from "node:fs/promises";
import path from "node:path";

/** Fonts and seal for server-drawn PDFs. Traced into the PDF routes by next.config.ts. */
export type PdfAssets = { sans: Uint8Array; bold: Uint8Array; serif: Uint8Array; seal: Uint8Array };

// Literal paths so the bundler can trace exactly these files rather than the whole project.
export async function loadPdfAssets(): Promise<PdfAssets> {
  const [sans, bold, serif, seal] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf")),
    readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans-Bold.ttf")),
    readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSerif-Bold.ttf")),
    readFile(path.join(process.cwd(), "public", "nba-seal.png")),
  ]);
  return { sans, bold, serif, seal };
}
