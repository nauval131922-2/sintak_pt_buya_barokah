'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import BaseModal from '@/components/ui/BaseModal';
import {
  changelogDismissKey,
  getPageChangelog,
  getPageChangelogByPath,
  type PageChangelog,
} from '@/lib/page-changelogs';

interface PageChangelogModalProps {
  /** Jika diisi, pakai pageKey ini. Jika kosong, resolve dari pathname. */
  pageKey?: string;
}

export default function PageChangelogModal({ pageKey }: PageChangelogModalProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);
  const [active, setActive] = useState<PageChangelog | null>(null);

  const resolveChangelog = useCallback((): PageChangelog | null => {
    if (pageKey) return getPageChangelog(pageKey);
    return getPageChangelogByPath(pathname);
  }, [pageKey, pathname]);

  const tryAutoOpen = useCallback((changelog: PageChangelog | null) => {
    if (!changelog) {
      setOpen(false);
      setForced(false);
      setActive(null);
      return;
    }
    setActive(changelog);
    try {
      const dismissed = localStorage.getItem(
        changelogDismissKey(changelog.pageKey, changelog.version)
      );
      if (dismissed === '1') {
        setOpen(false);
        setForced(false);
        return;
      }
      setForced(false);
      setOpen(true);
    } catch {
      setOpen(false);
    }
  }, []);

  // Auto-show saat ganti halaman / mount
  useEffect(() => {
    tryAutoOpen(resolveChangelog());
  }, [resolveChangelog, tryAutoOpen]);

  // Tombol header: buka ulang (abaikan dismiss)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ pageKey?: string }>).detail;
      const changelog = detail?.pageKey
        ? getPageChangelog(detail.pageKey)
        : resolveChangelog();
      if (!changelog) return;
      setActive(changelog);
      setForced(true);
      setOpen(true);
    };
    window.addEventListener('open-page-changelog', handler);
    return () => window.removeEventListener('open-page-changelog', handler);
  }, [resolveChangelog]);

  const handleClose = () => {
    // Tutup saja — tidak simpan storage, F5 bisa muncul lagi (kecuali sudah "jangan tampilkan")
    setOpen(false);
    setForced(false);
  };

  const handleDontShowAgain = () => {
    if (!active) return;
    try {
      localStorage.setItem(
        changelogDismissKey(active.pageKey, active.version),
        '1'
      );
    } catch {
      // ignore
    }
    setOpen(false);
    setForced(false);
  };

  if (!active) return null;

  return (
    <BaseModal
      isOpen={open}
      onClose={handleClose}
      title={active.title}
      subtitle={active.date ? `Log perubahan · ${active.date}` : 'Log perubahan'}
      icon={Sparkles}
      maxWidth="max-w-md"
      closeOnBackdrop={true}
      footer={
        <>
          {!forced ? (
            <button
              type="button"
              onClick={handleDontShowAgain}
              className="px-4 h-10 text-[12px] font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Jangan tampilkan lagi
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleClose}
            className="px-5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm"
          >
            Tutup
          </button>
        </>
      }
    >
      <ul className="flex flex-col gap-2.5">
        {active.items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-[13px] text-gray-700 font-medium leading-snug"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </BaseModal>
  );
}
