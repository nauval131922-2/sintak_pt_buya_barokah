import { NextResponse } from 'next/server';

/**
 * ponytail: list payload without raw_data blob.
 * Optionally lift keys from raw_data into top-level when column not denorm yet.
 */
export function stripRawData(
  rows: any[],
  extractKeys?: string[],
): any[] {
  if (!rows?.length) return rows || [];
  return rows.map((row) => {
    if (!row || row.raw_data == null) {
      if (!row) return row;
      const { raw_data: _, ...rest } = row;
      return rest;
    }
    const extra: Record<string, unknown> = {};
    if (extractKeys?.length) {
      try {
        const parsed = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
        if (parsed && typeof parsed === 'object') {
          for (const k of extractKeys) {
            if (row[k] == null || row[k] === '') {
              const v = (parsed as any)[k];
              if (v != null && v !== '') extra[k] = v;
            }
          }
        }
      } catch { /* ignore bad json */ }
    }
    const { raw_data: _, ...rest } = row;
    return Object.keys(extra).length ? { ...rest, ...extra } : rest;
  });
}

/** Keys still only in raw_data for orders list UI */
export const ORDERS_LIST_RAW_KEYS = [
  'qty_order', 'spesifikasi', 'cmd', 'detil', 'username', 'recid', 'faktur_pb', 'produk', 'status',
];

/** Keys still only in raw_data for sales_orders list UI */
export const SALES_ORDERS_LIST_RAW_KEYS = [
  'faktur_surat_jalan', 'faktur_pelunasan_piutang',
];

/**
 * Standardized error response for API routes
 */
export function apiError(message: string, status: number = 500, details?: any) {
  const response: any = {
    error: message,
    success: false,
  };

  if (process.env.NODE_ENV === 'development' && details) {
    response.details = details;
  }

  // Add digest for production errors (can be used to look up logs)
  if (status >= 500 && process.env.NODE_ENV === 'production') {
    response.digest = generateDigest(message, details);
  }

  return NextResponse.json(response, { status });
}

/**
 * Generate a short digest/hash for error tracking
 */
function generateDigest(message: string, details?: any): string {
  const str = `${message}-${JSON.stringify(details)}`;
  // Simple hash - in production you might want something more robust
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `err_${Math.abs(hash).toString(36)}`;
}

/**
 * Wrapper for API route handlers to catch errors automatically
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args): Promise<ReturnType<T>> => {
    try {
      return await handler(...args);
    } catch (err: any) {
      // Log the error
      console.error(`API Error [${handler.name}]:`, err);

      // Return standardized error response
      return apiError(
        err.message || 'Internal server error',
        err.status || 500,
        process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
      ) as any;
    }
  };
}

/**
 * Validate required fields in request data
 */
export function validateRequest(data: any, requiredFields: string[]): { valid: boolean; error?: string } {
  const missing = requiredFields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Extract error message from unknown error object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return String(error);
}
