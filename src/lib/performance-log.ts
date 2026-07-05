import db from './db';

export interface PerformanceLogInput {
  username?: string | null;
  type: 'api' | 'page_load' | 'action' | 'scrape' | 'import';
  source: 'backend' | 'frontend';
  module?: string;
  action: string;
  endpoint?: string;
  method?: string;
  durationMs: number;
  statusCode?: number;
  success?: boolean;
  message?: string;
  metadata?: Record<string, unknown>;
}

const SLOW_MS = 1000;

export async function recordPerformanceLog(input: PerformanceLogInput) {
  const shouldLog = input.success === false || input.durationMs >= SLOW_MS;
  if (!shouldLog) return;

  try {
    await db.execute({
      sql: `
        INSERT INTO performance_logs (
          created_at, username, type, source, module, action, endpoint, method,
          duration_ms, status_code, success, message, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        new Date().toISOString(),
        input.username || null,
        input.type,
        input.source,
        input.module || null,
        input.action,
        input.endpoint || null,
        input.method || null,
        Math.round(input.durationMs),
        input.statusCode ?? null,
        input.success === false ? 0 : 1,
        input.message || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ],
    });
  } catch (err) {
    // ponytail: telemetry tidak boleh bikin request utama gagal; kalau tabel belum siap, skip.
    console.warn('[performance-log] failed to record', err);
  }
}
