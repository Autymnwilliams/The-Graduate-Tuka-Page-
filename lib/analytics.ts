import { appendFile, mkdir } from "fs/promises";
import path from "path";
import type { AnalyticsEvent } from "./types";

const EVENTS_FILE = path.join(process.cwd(), "data", "events.json");

/**
 * Records one analytics event. Always logs to stdout (captured by Vercel's
 * function logs, exportable from the dashboard) since Vercel's production
 * filesystem is read-only/ephemeral outside /tmp — the local JSON-lines file
 * is a dev-time convenience on top of that, not the source of truth.
 */
export async function recordEvent(event: AnalyticsEvent): Promise<void> {
  const line = JSON.stringify(event);
  console.log(`[analytics] ${line}`);

  try {
    await mkdir(path.dirname(EVENTS_FILE), { recursive: true });
    await appendFile(EVENTS_FILE, line + "\n", "utf-8");
  } catch {
    // Best-effort only.
  }
}
