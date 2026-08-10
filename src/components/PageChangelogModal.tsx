'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, ChevronDown } from 'lucide-react';
import BaseModal from '@/components/ui/BaseModal';
import {
  changelogDismissKey,
  getAllPageChangelogs,
  getAllPageChangelogsByPath,
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
  const [active, setActive] = useState<PageChangelog[] | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const resolveChangelog = useCallback((): PageChangelog[] => {
    if (pageKey) return getAllPageChangelogs(pageKey);
    return getAllPageChangelogsByPath(pathname);
  }, [pageKey, pathname]);

  // ponytail: group by sortDate+pageKey, merge items dengan prefix versionLabel
  const groupByDate = useCallback((changelogs: PageChangelog[]) => {
    const map = new Map<string, PageChangelog>();
    for (const c of changelogs) {
      const key = `${c.sortDate}-${c.pageKey}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...c });
      } else {
        const prefix = c.versionLabel ? `${c.versionLabel}: ` : '';
        existing.items = [...existing.items, ...c.items.map(i => prefix + i)];
      }
    }
    return [...map.values()];
  }, []);

  const tryAutoOpen = useCallback((changelogs: PageChangelog[]) => {
    if (!changelogs || changelogs.length === 0) {
      setOpen(false);
      setForced(false);
      setActive(null);
      setOpenSections(new Set());
      return;
    }
    const grouped = groupByDate(changelogs);
    setActive(grouped);
    
    // Default: buka semua accordion
    const allKeys = new Set(grouped.map(c => c.version));
    setOpenSections(allKeys);
    
    // Cek dismiss: jika SEMUA rilis sudah dismissed, jangan buka modal
    try {
      const allDismissed = changelogs.every(c => 
        localStorage.getItem(changelogDismissKey(c.pageKey, c.version)) === '1'
      );
      if (allDismissed) {
        setOpen(false);
        setForced(false);
        return;
      }
      setForced(false);
      setOpen(true);
    } catch {
      setOpen(false);
    }
  }, [groupByDate]);

  // Auto-show saat ganti halaman / mount
  useEffect(() => {
    tryAutoOpen(resolveChangelog());
  }, [resolveChangelog, tryAutoOpen]);

  // Tombol header: buka ulang (abaikan dismiss)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ pageKey?: string }>).detail;
      const changelogs = detail?.pageKey
        ? getAllPageChangelogs(detail.pageKey)
        : resolveChangelog();
      if (!changelogs || changelogs.length === 0) return;
      const grouped = groupByDate(changelogs);
      setActive(grouped);
      const allKeys = new Set(grouped.map(c => c.version));
      setOpenSections(allKeys);
      setForced(true);
      setOpen(true);
    };
    window.addEventListener('open-page-changelog', handler);
    return () => window.removeEventListener('open-page-changelog', handler);
  }, [resolveChangelog, groupByDate]);

  const handleClose = () => {
    // Tutup saja — tidak simpan storage, F5 bisa muncul lagi (kecuali sudah "jangan tampilkan")
    setOpen(false);
    setForced(false);
  };

  const handleDontShowAgain = () => {
    if (!active) return;
    try {
      // Dismiss SEMUA rilis sekaligus
      active.forEach(changelog => {
        localStorage.setItem(
          changelogDismissKey(changelog.pageKey, changelog.version),
          '1'
        );
      });
    } catch {
      // ignore
    }
    setOpen(false);
    setForced(false);
  };

  if (!active || active.length === 0) return null;

  const toggleSection = (version: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  return (
    <BaseModal
      isOpen={open}
      onClose={handleClose}
      title={active[0].title}
      subtitle="Log perubahan"
      icon={Sparkles}
      maxWidth="max-w-lg"
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
      <div className="flex flex-col gap-3">
        {active.map((changelog, idx) => {
          const isOpen = openSections.has(changelog.version);
          return (
            <div key={`${changelog.pageKey}-${changelog.version}-${idx}`} className="border border-gray-100 rounded-xl overflow-hidden">
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleSection(changelog.version)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 hover:bg-gray-100/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-600 shrink-0" />
                  <span className="text-[13px] font-bold text-gray-800">
                    {changelog.date || changelog.sortDate}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    · {changelog.items.length} poin
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <ul className="flex flex-col gap-2.5 px-4 py-3 bg-white">
                  {changelog.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[13px] text-gray-700 font-medium leading-snug"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </BaseModal>
  );
}
