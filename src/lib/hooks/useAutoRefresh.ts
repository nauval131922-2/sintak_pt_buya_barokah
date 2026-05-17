import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook untuk auto-refresh data pada interval tertentu.
 * Hanya berjalan saat tab aktif (document.visibilityState === 'visible').
 *
 * @param callback - fungsi fetch yang dipanggil ulang
 * @param intervalMs - interval dalam ms, default 120000 (2 menit)
 * @param enabled - aktifkan/nonaktifkan, default true
 * @returns lastUpdated - timestamp terakhir kali callback dipanggil (null sebelum pertama kali)
 */
export function useAutoRefresh(
  callback: () => void,
  intervalMs: number = 120_000,
  enabled: boolean = true
): Date | null {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Set waktu mount di client saja (hindari hydration mismatch)
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  const runAndMark = useCallback(() => {
    callbackRef.current();
    setLastUpdated(new Date());
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') runAndMark();
    }, intervalMs);
  }, [intervalMs, runAndMark]);

  useEffect(() => {
    if (!enabled) return;

    startTimer();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runAndMark();
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, startTimer, runAndMark]);

  return lastUpdated;
}

/** Format Date ke string "HH:mm:ss" WIB */
export function formatLastUpdated(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  });
}
