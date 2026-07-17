'use client';

import React from 'react';

// ponytail: shared glass card wrapper — applies the upgraded .card token
// (blur + translucent + hover lift + emerald ring) consistently across pages.

export function Card({
  children,
  className = '',
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`card ${hover ? 'hover-lift' : ''} ${className}`}>
      {children}
    </div>
  );
}

export default Card;
