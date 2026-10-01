import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";
import type { PdfAssets } from "./assets.ts";

/** Small drawing kit shared by the server-drawn invoice and certificate. Coordinates are PDF points. */

export const A4 = { width: 595.28, height: 841.89 } as const;

export type Fonts = { sans: PDFFont; bold: PDFFont; serif: PDFFont };

export type Canvas = { pdf: PDFDocument; page: PDFPage; fonts: Fonts; seal: PDFImage };

export async function createCanvas(assets: PdfAssets): Promise<Canvas> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [sans, bold, serif, seal] = await Promise.all([
    pdf.embedFont(assets.sans, { subset: true }),
    pdf.embedFont(assets.bold, { subset: true }),
    pdf.embedFont(assets.serif, { subset: true }),
    pdf.embedPng(assets.seal),
  ]);
  return { pdf, page: pdf.addPage([A4.width, A4.height]), fonts: { sans, bold, serif }, seal };
}

export function hex(value: string): RGB {
  const n = Number.parseInt(value.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export type TextStyle = { font: PDFFont; size: number; color: RGB };

/** Greedy word wrap; words longer than the line are broken by character. */
export function wrap(value: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of value.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue; }
      if (line) lines.push(line);
      line = "";
      for (const character of word) {
        if (line && font.widthOfTextAtSize(line + character, size) > width) { lines.push(line); line = character; }
        else line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Only the text properties: callers may pass a wider options object that also carries x/y. */
function textOptions(style: TextStyle): TextStyle {
  return { font: style.font, size: style.size, color: style.color };
}

export function drawLeft(page: PDFPage, value: string, x: number, y: number, style: TextStyle): void {
  page.drawText(value, { ...textOptions(style), x, y });
}

export function drawRight(page: PDFPage, value: string, right: number, y: number, style: TextStyle): void {
  page.drawText(value, { ...textOptions(style), x: right - style.font.widthOfTextAtSize(value, style.size), y });
}

export function drawCentered(page: PDFPage, value: string, centerX: number, y: number, style: TextStyle): void {
  page.drawText(value, { ...textOptions(style), x: centerX - style.font.widthOfTextAtSize(value, style.size) / 2, y });
}

/** Letter-spaced, centred text; pdf-lib has no character spacing, so glyphs are placed one by one. */
export function drawSpaced(page: PDFPage, value: string, centerX: number, y: number, spacing: number, style: TextStyle): void {
  const characters = [...value];
  const total = characters.reduce((sum, character) => sum + style.font.widthOfTextAtSize(character, style.size), 0) + spacing * (characters.length - 1);
  let x = centerX - total / 2;
  for (const character of characters) {
    page.drawText(character, { ...textOptions(style), x, y });
    x += style.font.widthOfTextAtSize(character, style.size) + spacing;
  }
}

/** Draws wrapped lines downward from `y` (the first baseline) and returns the baseline after the last. */
export function drawWrapped(page: PDFPage, value: string, options: TextStyle & { x: number; y: number; width: number; leading: number; align?: "left" | "center" | "right" }): number {
  let y = options.y;
  for (const line of wrap(value, options.font, options.size, options.width)) {
    if (options.align === "center") drawCentered(page, line, options.x + options.width / 2, y, options);
    else if (options.align === "right") drawRight(page, line, options.x + options.width, y, options);
    else drawLeft(page, line, options.x, y, options);
    y -= options.leading;
  }
  return y;
}

/** Shrinks the size until the value fits on one line, down to `minimum`. */
export function fitSize(value: string, font: PDFFont, width: number, start: number, minimum: number): number {
  let size = start;
  while (size > minimum && font.widthOfTextAtSize(value, size) > width) size -= 0.25;
  return size;
}

export async function toPdfBlob(pdf: PDFDocument): Promise<Blob> {
  return new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" });
}
