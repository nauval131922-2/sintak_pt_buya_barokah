import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Infraction } from '../types';

const PAGE_SIZE = 50;
const LS_START  = 'infraction_startDate';
const LS_END    = 'infraction_endDate';
const LS_LAST   = 'infraction_lastVisitDate';

interface UseInfractionsDataProps {
  initial: Infraction[];
  initialStartDate?: Date;
  initialEndDate?: Date;
  onPeriodChange?: (start: string, end: string) => void;
}

export function useInfractionsData({
  initial,
  initialStartDate,
  initialEndDate,
  onPeriodChange,
}: UseInfractionsDataProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [infractions, setInfractions] = useState<Infraction[]>(initial);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const today = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  })();

  const [startDate, setStartDate] = useState<Date>(() => {
    if (initialStartDate) return initialStartDate;
    return today;
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    if (initialEndDate) return initialEndDate;
    return today;
  });

  const initialMount = useRef(true);

  // Mount: baca localStorage, reset ke hari ini kalau hari sudah berganti
  useEffect(() => {
    setIsMounted(true);
    const todayStr = today.toDateString();
    const lastVisit = localStorage.getItem(LS_LAST);
    const isNewDay = lastVisit !== todayStr;

    // Update tanggal kunjungan terakhir
    localStorage.setItem(LS_LAST, todayStr);

    if (isNewDay) {
      // Hari baru → reset ke hari ini
      setStartDate(today);
      setEndDate(today);
      localStorage.setItem(LS_START, today.toISOString());
      localStorage.setItem(LS_END, today.toISOString());
    } else {
      // Hari sama → restore nilai yang tersimpan
      const savedStart = localStorage.getItem(LS_START);
      const savedEnd   = localStorage.getItem(LS_END);
      if (savedStart) {
        const d = new Date(savedStart);
        if (!isNaN(d.getTime())) setStartDate(d);
      }
      if (savedEnd) {
        const d = new Date(savedEnd);
        if (!isNaN(d.getTime())) setEndDate(d);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan ke localStorage setiap kali user mengubah tanggal
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(LS_START, startDate.toISOString());
  }, [startDate, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(LS_END, endDate.toISOString());
  }, [endDate, isMounted]);

  // Sync state when initial data changes (from parent refresh)
  useEffect(() => {
    setInfractions(initial);
  }, [initial]);


  // Fetch filtered data based on date range
  const fetchFilteredData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const start = formatDate(startDate);
      const end = formatDate(endDate);

      // Optimistically reset visible count for new data
      setVisibleCount(PAGE_SIZE);

      const startTime = performance.now();
      const res = await fetch(`/api/infractions?start=${start}&end=${end}`);
      if (res.ok) {
        const json = await res.json();
        const endTime = performance.now();
        setLoadTime(Math.round(endTime - startTime));
        setInfractions(json.data || []);
        if (onPeriodChange) onPeriodChange(start, end);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }

  }, [startDate, endDate, onPeriodChange]);

  // Auto-fetch when dates change (skip initial mount to avoid double-loading if parent matches)
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    fetchFilteredData();
  }, [startDate, endDate, fetchFilteredData]);

  // Listen for cross-tab data updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        fetchFilteredData();
        startTransition(() => {
          router.refresh();
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, fetchFilteredData]);

  return {
    infractions,
    isRefreshing,
    visibleCount,
    setVisibleCount,
    fetchFilteredData,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loadTime,
  };
}



