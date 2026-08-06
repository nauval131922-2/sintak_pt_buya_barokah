'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

export function getZoomScale(): number {
  if (typeof window === 'undefined') return 1;
  const w = window.innerWidth;
  if (w >= 768 && w < 1920) return 0.82;
  return 1;
}

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? createPortal(
    <div className="md:[zoom:0.82] min-[1920px]:[zoom:1]">{children}</div>,
    document.body
  ) : null;
}
















