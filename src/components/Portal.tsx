'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

export function getZoomScale(): number {
  if (typeof window === 'undefined') return 1;
  // Cek apakah media query CSS [zoom:1] aktif
  if (window.matchMedia('(min-width: 1920px)').matches) return 1;
  if (window.matchMedia('(min-width: 768px)').matches) return 0.82;
  return 0.90;
}

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? createPortal(
    <div className="[zoom:0.90] md:[zoom:0.82] min-[1920px]:[zoom:1]">{children}</div>,
    document.body
  ) : null;
}
















