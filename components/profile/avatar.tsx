import Image from "next/image";
import { Icon } from "@/components/mobile/icon";

/** mobile profile photo: 84px (96 on Edit Profile), radius 20, a 2px green ring, person glyph when unset. */
export function ProfileAvatar({ size = 84, url }: { size?: number; url: string | null }) {
  return <span className="grid shrink-0 place-items-center overflow-hidden rounded-[20px] border-2 border-primary bg-surface-muted text-text-muted" style={{ width: size, height: size }}>
    {/* Unoptimized: the photo is at most 96px, and its ?v= cache buster is a query the optimizer would refuse. */}
    {url ? <Image alt="Profile photo" className="size-full object-cover" height={size} src={url} unoptimized width={size}/> : <Icon name="person" size={44}/>}
  </span>;
}
