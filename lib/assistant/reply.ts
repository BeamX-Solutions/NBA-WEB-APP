import { isUuid } from "../calculator/contracts.ts";

/**
 * An assistant reply as something React can render without injecting HTML: paragraphs of lines of
 * plain, bold and link segments. The assistant writes light markdown ("**bold**",
 * "[TXN-00012-DOA](/transactions/<id>)", "- " lists); nothing else is interpreted.
 *
 * A link survives only when it points at one of the app's own screens the assistant is told to
 * link to. Anything else, an external address included, is shown as its label alone, so a
 * manipulated reply cannot send a practitioner off the site.
 */

export type ReplySegment =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "link"; text: string; href: string };

export type ReplyLine = ReplySegment[];
export type ReplyParagraph = ReplyLine[];

const FIXED_PATHS = new Set(["/payments", "/profile/plans"]);

/** The in-app paths a reply may link to. */
export function allowedReplyHref(href: string): boolean {
  if (FIXED_PATHS.has(href)) return true;
  const match = /^\/(transactions|certificates)\/([^/?#]+)$/.exec(href);
  return match !== null && isUuid(match[2]);
}

const INLINE = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*/g;

function parseLine(line: string): ReplyLine {
  const source = line.replace(/^\s*[-*]\s+/, "• ");
  const segments: ReplyLine = [];
  let last = 0;
  for (const match of source.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ kind: "text", text: source.slice(last, index) });
    const [, label, href, bold] = match;
    if (bold !== undefined) segments.push({ kind: "bold", text: bold });
    else if (allowedReplyHref(href)) segments.push({ kind: "link", text: label, href });
    else segments.push({ kind: "text", text: label });
    last = index + match[0].length;
  }
  if (last < source.length) segments.push({ kind: "text", text: source.slice(last) });
  return segments;
}

export function parseReply(reply: string): ReplyParagraph[] {
  return reply
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.split("\n").filter((line) => line.trim() !== "").map(parseLine))
    .filter((paragraph) => paragraph.length > 0);
}
