import React from 'react';

// ponytail: single shared keyword highlighter so every table can reuse it instead of copying
export function highlightText(text: string, search: string): React.ReactNode {
  if (!search || !search.trim()) return text;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase()
          ? <mark key={i} className="bg-yellow-100 text-yellow-950 px-0.5 rounded font-bold">{part}</mark>
          : part
      )}
    </>
  );
}
