'use client';

import { useEffect, useRef, useState } from 'react';

export function useAutoFitColumns(minCardWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(1);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const c = Math.max(1, Math.floor(w / minCardWidth));
      // ponytail: auto-fit sederhana — kalau card kekecilan (scroll muncul) floor akan turunkan cols otomatis
      setCols(c);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [minCardWidth]);

  return { ref, cols };
}
