/**
 * Types and utilities for scraping operations
 */

export interface ScrapedRecord {
  [key: string]: any;
}

export interface BatchOperation {
  sql: string;
  args: any[];
}

// ponytail: URL/secret alert dipindah ke env var agar tidak hardcode di repo.
// Fail-closed: tanpa WEBHOOK_ALERT_SECRET, alert tidak dikirim (fallback publik dihapus).
const WEBHOOK_URL = process.env.WEBHOOK_ALERT_URL || "http://localhost:8644/webhooks/sintak-alert";
const WEBHOOK_SECRET = process.env.WEBHOOK_ALERT_SECRET;

export async function sendErrorAlert(source: string, error: unknown): Promise<void> {
  if (!WEBHOOK_SECRET) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        type: "error",
        source,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Webhook gagal diabaikan — jangan sampai error handling malah bikin error baru
  }
}
