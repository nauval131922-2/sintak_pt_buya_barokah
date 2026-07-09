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

const WEBHOOK_URL = "http://localhost:8644/webhooks/sintak-alert";
const WEBHOOK_SECRET = "dfff91...d213";

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
