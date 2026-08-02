'use client';

import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { getPageChangelogByPath } from '@/lib/page-changelogs';

export default function ChangelogButton({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const changelog = getPageChangelogByPath(pathname);

  if (!changelog) return null;

  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent('open-page-changelog', {
        detail: { pageKey: changelog.pageKey },
      })
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`text-slate-300 hover:text-emerald-500 transition-colors inline-flex items-center justify-center ${className}`}
      title="Log perubahan"
      aria-label="Log perubahan"
    >
      <Sparkles size={16} className="cursor-pointer" />
    </button>
  );
}
