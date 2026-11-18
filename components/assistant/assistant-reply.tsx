import Link from "next/link";
import { parseReply, type ReplySegment } from "@/lib/assistant/reply";

function Segment({ segment, onLinkClick }: { segment: ReplySegment; onLinkClick?: () => void }) {
  if (segment.kind === "bold") return <strong className="font-semibold">{segment.text}</strong>;
  if (segment.kind === "link") return <Link className="font-semibold text-primary underline underline-offset-2" href={segment.href} onClick={onLinkClick}>{segment.text}</Link>;
  return <>{segment.text}</>;
}

/** An assistant reply as React elements: never injected HTML, and links only to the app's own screens. */
export function AssistantReply({ content, onLinkClick }: { content: string; onLinkClick?: () => void }) {
  return <div className="flex flex-col gap-2">
    {parseReply(content).map((paragraph, p) => <p className="m-0" key={p}>
      {paragraph.map((line, l) => <span className="block" key={l}>
        {line.map((segment, s) => <Segment key={s} onLinkClick={onLinkClick} segment={segment}/>)}
      </span>)}
    </p>)}
  </div>;
}
