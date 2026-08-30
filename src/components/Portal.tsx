'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

export function getZoomScale(el?: HTMLElement | null): number {
  if (typeof window === 'undefined') return 1;

  // Jika ada elemen DOM, ukur rasio zoom riil elemen terhadap viewport
  if (el) {
    const parentPortal = el.closest('[data-portal-root]');
    if (parentPortal) {
      const rect = parentPortal.getBoundingClientRect();
      const offsetWidth = (parentPortal as HTMLElement).offsetWidth;
      if (rect.width > 0 && offsetWidth > 0) {
        const computedScale = rect.width / offsetWidth;
        if (computedScale > 0.1 && computedScale < 5) {
          return computedScale;
        }
      }
    }
  }

  // Fallback: cek computed zoom pada element wrapper utama atau matchMedia
  const mainWrapper = document.querySelector('[data-portal-root]') || document.body.firstElementChild;
  if (mainWrapper) {
    const rect = mainWrapper.getBoundingClientRect();
    const offsetWidth = (mainWrapper as HTMLElement).offsetWidth;
    if (rect.width > 0 && offsetWidth > 0) {
      const computedScale = rect.width / offsetWidth;
      if (computedScale > 0.1 && computedScale < 5) {
        return computedScale;
      }
    }
  }

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
    <div data-portal-root className="[zoom:0.90] md:[zoom:0.82] min-[1920px]:[zoom:1]">{children}</div>,
    document.body
  ) : null;
}
















