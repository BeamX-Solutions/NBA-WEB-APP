/**
 * Profile photos, on mobile's contract (NBA APP 20260922130000_profile_photos): profiles.avatar_url
 * holds an object path in the public avatars bucket, `{user_id}/{file}`, and each app builds the
 * URL when it shows the photo. Before October 2026 this app stored the full public URL instead,
 * which mobile could not load, so a stored URL under this project's bucket is still understood.
 */

export const AVATAR_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export type AvatarType = keyof typeof AVATAR_TYPES;

const pathPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9._-]+$/i;

export function isAvatarType(value: string): value is AvatarType {
  return Object.hasOwn(AVATAR_TYPES, value);
}

/** A new object path for an upload. Unique per upload, so replacing a photo never overwrites a file. */
export function avatarPathFor(userId: string, type: AvatarType, now: number = Date.now()): string {
  return `${userId}/avatar-${now}.${AVATAR_TYPES[type]}`;
}

function publicPrefix(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/avatars/`;
}

/** The object path a stored value names, or null for anything that is not a photo in this project's bucket. */
export function avatarPathFrom(stored: unknown, supabaseUrl: string): string | null {
  if (typeof stored !== "string" || !stored) return null;
  const prefix = publicPrefix(supabaseUrl);
  const path = stored.startsWith(prefix) ? stored.slice(prefix.length).split(/[?#]/)[0] : stored;
  return pathPattern.test(path) && !path.includes("..") ? path : null;
}

/**
 * The URL to show. `version` (the profile's updated_at) changes whenever the photo does, so a photo
 * replaced in place, as mobile does, is fetched again rather than served from a cache.
 */
export function avatarDisplayUrl(stored: unknown, supabaseUrl: string, version?: string | null): string | null {
  const path = avatarPathFrom(stored, supabaseUrl);
  if (!path) return null;
  const url = `${publicPrefix(supabaseUrl)}${path}`;
  return version ? `${url}?v=${encodeURIComponent(version)}` : url;
}

const signatures: Record<AvatarType, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => b[i] === byte),
  // "RIFF", four length bytes, then "WEBP".
  "image/webp": (b) => [0x52, 0x49, 0x46, 0x46].every((byte, i) => b[i] === byte) && [0x57, 0x45, 0x42, 0x50].every((byte, i) => b[i + 8] === byte),
};

/** Whether a file's first twelve bytes are what its declared type says they are. */
export function matchesAvatarSignature(type: AvatarType, firstBytes: Uint8Array): boolean {
  return signatures[type](firstBytes);
}
