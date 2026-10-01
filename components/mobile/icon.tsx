/**
 * A Material Icon by the same name mobile passes to @expo/vector-icons/MaterialIcons
 * ("notifications-none", "receipt-long"). The font's ligatures use underscores.
 */
export type IconName = string;

export function Icon({ name, size = 24, color, className = "" }: { name: IconName; size?: number; color?: string; className?: string }) {
  return <span aria-hidden="true" className={`material-icons shrink-0 select-none ${className}`} style={{ fontSize: size, width: size, height: size, color }}>{name.replaceAll("-", "_")}</span>;
}
