'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ExternalLink, FileText, ChevronDown } from 'lucide-react';
import {
  groupChangelogsBySortDate,
  type PageChangelog,
} from '@/lib/page-changelogs';

type Entry = PageChangelog & { path: string | null };

// ponytail: merge entries dengan pageKey+sortDate sama, struktur section v1/v2
function mergeEntriesByPage(entries: Entry[]): Array<Entry & { sections?: Array<{label: string; items: string[]}> }> {
  const map = new Map<string, Entry & { sections: Array<{label: string; items: string[]}> }>();
  for (const e of entries) {
    const key = `${e.pageKey}-${e.sortDate}`;
    const existing = map.get(key);
    if (!existing) {
      const initialSections = e.versionLabel
        ? [{ label: e.versionLabel, items: e.items }]
        : e.items.length > 0 ? [{ label: '', items: e.items }] : [];
      map.set(key, { ...e, sections: initialSections });
    } else {
      if (e.versionLabel) {
        existing.sections.push({ label: e.versionLabel, items: e.items });
      } else {
        if (existing.sections.length === 0) {
          existing.sections.push({ label: '', items: e.items });
        } else {
          existing.sections[0].items = [...existing.sections[0].items, ...e.items];
        }
        existing.items = [...existing.items, ...e.items];
      }
    }
  }
  return [...map.values()];
}

export default function LogPerubahanClient({ entries }: { entries: Entry[] }) {
  const merged = useMemo(() => mergeEntriesByPage(entries), [entries]);
  const groups = useMemo(() => groupChangelogsBySortDate(merged), [merged]);

  const [openKeys, setOpenKeys] = useState<Set<string>>(() =>
    new Set(merged.map((e) => `${e.pageKey}-${e.version}`))
  );

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (merged.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-100 bg-white shadow-sm shadow-emerald-900/5 p-12">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
          <FileText className="text-gray-400" size={32} strokeWidth={1.5} />
        </div>
        <div className="text-center max-w-sm">
          <p className="text-[14px] font-bold text-gray-800 mb-1">Belum ada log</p>
          <p className="text-[13px] text-gray-400 font-medium leading-relaxed">
            Belum ada log perubahan untuk menu yang Anda bisa akses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.sortDate || group.label} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-0.5 py-1">
            <h2 className="text-[13px] font-bold text-gray-800 tracking-tight shrink-0">
              {group.label}
            </h2>
            <span className="text-[11px] font-bold text-gray-400 bg-white border border-gray-100 rounded-full px-2 h-6 inline-flex items-center shrink-0">
              {group.entries.length} menu
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {group.entries.map((e) => {
              const uniqueKey = `${e.pageKey}-${e.version}`;
              const isOpen = openKeys.has(uniqueKey);
              return (
                <article
                  key={uniqueKey}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm shadow-emerald-900/5 overflow-hidden"
                >
                  <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-1 pr-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggle(uniqueKey)}
                      className="flex-1 flex items-center gap-3 min-w-0 px-2 py-1 text-left rounded-lg hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Sparkles size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13px] font-bold text-gray-800 tracking-tight leading-snug truncate">
                          {e.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          {('sections' in e && Array.isArray(e.sections) && e.sections.length > 0)
                            ? e.sections.reduce((sum, s) => sum + s.items.length, 0)
                            : e.items.length} poin perubahan
                        </p>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {e.path && (
                      <Link
                        href={e.path}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 h-8 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-100 rounded-lg transition-colors"
                        title="Buka halaman"
                      >
                        Buka
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-50 ml-1">
                      {('sections' in e && Array.isArray(e.sections) && e.sections.length > 0 && e.sections.some(s => s.label)) ? (
                        e.sections.map((section: {label: string; items: string[]}, sIdx: number) => (
                          <div key={sIdx} className={sIdx > 0 ? 'mt-4' : ''}>
                            {section.label && <div className="text-[12px] font-bold text-emerald-700 mb-2">{section.label}:</div>}
                            <ul className="flex flex-col gap-2">
                              {section.items.map((item: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2.5 text-[13px] text-gray-700 font-medium leading-snug"
                                >
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {e.items.map((item, i) => (
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
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
