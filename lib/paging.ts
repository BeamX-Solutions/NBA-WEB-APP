/**
 * Keyset paging for owner lists, newest first: a page ends at the last row's timestamp and id, and
 * the next page starts strictly after it. Unlike an offset, a row inserted meanwhile cannot shift
 * the next page and repeat or skip a record.
 *
 * The cursor travels through the browser, so it is opaque text that is validated on the way back
 * in and only ever reaches a query as a parsed timestamp and UUID.
 */

export const PAGE_SIZE = 20;

export type Cursor = { at: string; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Postgres timestamptz as PostgREST returns it: 2026-10-01T11:55:00.123456+00:00 */
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

export function encodeCursor(at: string, id: string): string {
  return `${at}|${id}`;
}

export function parseCursor(value: unknown): Cursor | null {
  if (typeof value !== "string" || value.length > 80) return null;
  const [at, id, extra] = value.split("|");
  if (extra !== undefined || !at || !id || !TIMESTAMP.test(at) || !UUID.test(id)) return null;
  return Number.isNaN(new Date(at).getTime()) ? null : { at, id };
}

/** The PostgREST `or` filter for rows strictly after the cursor, ordered by `column` desc, id desc. */
export function afterCursorFilter(column: string, cursor: Cursor): string {
  return `${column}.lt."${cursor.at}",and(${column}.eq."${cursor.at}",id.lt.${cursor.id})`;
}

/**
 * Splits a page fetched with one extra row: the extra row only says there is more, and the cursor
 * comes from the last row actually shown.
 */
export function pageOf<T>(rows: readonly T[], cursorOf: (row: T) => string | null): { rows: T[]; nextCursor: string | null } {
  if (rows.length <= PAGE_SIZE) return { rows: [...rows], nextCursor: null };
  const page = rows.slice(0, PAGE_SIZE);
  return { rows: page, nextCursor: cursorOf(page[page.length - 1]) };
}
