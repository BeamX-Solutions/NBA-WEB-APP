import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The service worker, stamped with this build's version.
 *
 * A browser installs a new worker only when the script's bytes change. With a fixed version the
 * worker installed on someone's first visit stayed for good, serving that build's /offline
 * calculator after every later deploy. Prerendered once per build; headers come from next.config.ts.
 */
export const dynamic = "force-static";

const buildVersion = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || new Date().toISOString();
const versionLine = 'const VERSION = "__SW_VERSION__";';

export async function GET() {
  const source = await readFile(path.join(process.cwd(), "lib/pwa/service-worker.js"), "utf8");
  // Fails the build rather than shipping a worker that would never update again.
  if (!source.includes(versionLine)) throw new Error(`lib/pwa/service-worker.js must contain ${versionLine}`);
  return new Response(source.replace(versionLine, `const VERSION = ${JSON.stringify(buildVersion)};`), {
    headers: { "Content-Type": "application/javascript; charset=utf-8" },
  });
}
