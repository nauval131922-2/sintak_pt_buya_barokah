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
// Fallback ke nilai lama supaya perilaku default tidak berubah saat env belum diisi.
const WEBHOOK_URL = process.env.WEBHOOK_ALERT_URL || "http://localhost:8644/webhooks/sintak-alert";
const WEBHOOK_SECRET = process.env.WEBHOOK_ALERT_SECRET || "dfff91...d213";

export async function sendErrorAlert(source: string, error: unknown): Promise<void> {
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
