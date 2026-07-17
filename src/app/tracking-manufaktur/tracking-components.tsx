'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cardClass } from './tracking-styles';
import { toTitleCase, parseIndoDate } from './tracking-utils';

// Helper to highlight search keywords in text
export const HighlightedText = React.memo(
  ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(
      `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi',
    );
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-green-100 text-green-800 px-0.5 font-bold rounded-sm"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </span>
    );
  },
);
HighlightedText.displayName = 'HighlightedText';

// Memoized individual field to reduce render work
export const DataField = React.memo(
  ({ v, isRaw, highlight }: { v: any; isRaw: boolean; highlight: string }) => {
    // Strip HTML tags if value is a string
    let displayVal =
      typeof v === 'string' ? v.replace(/<[^>]*>?/gm, '').trim() : String(v);

    if (!isRaw) {
      const numVal = parseFloat(displayVal.replace(/,/g, ''));
      if (!isNaN(numVal) && displayVal.includes('.') && displayVal.length > 5) {
        displayVal = numVal.toLocaleString('id-ID', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
    }

    return <HighlightedText text={displayVal} highlight={highlight} />;
  },
);
DataField.displayName = 'DataField';

const RenderAllFieldsRaw = ({
  data,
  excludeKeys = [],
  highlightText = '',
}: {
  data: any;
  excludeKeys?: string[];
  highlightText?: string;
}) => {
  const normalizeKey = (key: string) =>
    String(key)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const handledKeys = useMemo(
    () => new Set([...excludeKeys].map(normalizeKey)),
    [excludeKeys],
  );
  const entries = useMemo(
    () =>
      data
        ? Object.entries(data).filter(
            ([key]) => !handledKeys.has(normalizeKey(String(key))),
          )
        : [],
    [data, handledKeys],
  );

  if (!data || entries.length === 0) return null;

  const rawFields = [
    'id',
    'kode_cabang',
    'kd_cabang',
    'tgl',
    'status',
    'created_at',
    'edited_at',
    'kd_barang',
    'recid',
    'top_hari',
    'kd_gudang',
    'create_at',
    'updated_at',
    'kd_pelanggan',
    'datetime_mulai',
    'datetime_selesai',
    'tgl_dibutuhkan',
    'tgl_close',
    'status_close',
    'jthtmp',
    'faktur_supplier',
    'tgl_lunas',
    'kd_porsekot',
    'kd_bank',
    'kd_supir',
    'kd_armada',
    'kd_eks',
    'waktu_kirim',
    'waktu_selesai',
    'tgl_expired',
    'gol_barang',
    'no_ref_pelanggan',
  ];
  return (
    <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1.5 overflow-hidden">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="flex gap-4 items-start text-[11px] group/field"
        >
          <div className="w-[120px] shrink-0 font-medium text-gray-400">
            {toTitleCase(key)}
          </div>
          <div className="flex-1 text-gray-800 font-bold break-words group-hover/field:text-green-600 transition-colors">
            <DataField
              v={val}
              isRaw={rawFields.includes(key.toLowerCase())}
              highlight={highlightText}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders of data cards
export const RenderAllFields = React.memo(RenderAllFieldsRaw);

// Optimized Card component with lazy rendering (Intersection Observer)
export const DataCard = React.memo(
  ({ item, highlightText }: { item: any; highlightText: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!cardRef.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '800px 0px', // Pre-render 800px before/after viewport for smooth scrolling
          threshold: 0.01,
        },
      );

      observer.observe(cardRef.current);

      return () => observer.disconnect();
    }, []);
    return (
      <div ref={cardRef} className={cardClass}>
        {isVisible ? (
          <RenderAllFields
            data={item}
            excludeKeys={[
              'raw_data',
              'id',
              'kd_gudang',
              'kd_cabang',
              'status',
              'status_close',
              'mydata',
              'create_at',
              'created_at',
              'updated_at',
              'edited_at',
              'username',
              'username_edited',
              'deleted_at',
              'username_deleted',
              'pr_edited_at',
              'sph_edited_at',
              'cmd',
              'detil',
              'redid',
              'recid',
            ]}
            highlightText={highlightText}
          />
        ) : (
          <div className="flex flex-col gap-2.5 animate-pulse">
            <div className="h-3 w-3/4 bg-gray-50 rounded-lg" />
            <div className="h-3 w-1/2 bg-gray-50 rounded-lg" />
            <div className="h-10 w-full bg-gray-50 rounded-lg" />
          </div>
        )}
      </div>
    );
  },
);
DataCard.displayName = 'DataCard';

// Helper component for uniform column rendering
export const RenderColumnContent = React.memo(
  ({
    label,
    data,
    items,
    debouncedFilterText,
    matchesFilter,
    extraLabel,
    subLabels = [],
    startDate,
    endDate,
    parseIndoDate: parseIndoDateProp,
  }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Unified date filtering for cards
    const filterByDate = (item: any) => {
      if (!item) return false;
      if (!startDate && !endDate) return true;

      // Check multiple common date keys (case-insensitive)
      const tglStr =
        item.tgl ||
        item.tanggal ||
        item.date ||
        item.Tgl ||
        item.Tanggal ||
        item.Date;
      if (!tglStr) return false; // If filter is active and no date found, hide it

      const itemDate = (parseIndoDateProp || parseIndoDate)(tglStr);
      if (!itemDate) return true; // Keep if can't parse (prevent accidental hiding of valid but weird data)

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      return true;
    };

    // Process items array
    const finalItems = useMemo(() => {
      let filtered = items || [];
      if (startDate || endDate) {
        filtered = filtered.filter(filterByDate);
      }
      if (debouncedFilterText) {
        filtered = filtered.filter((it: any) =>
          matchesFilter(it, debouncedFilterText),
        );
      }
      return filtered;
    }, [
      items,
      startDate,
      endDate,
      debouncedFilterText,
      matchesFilter,
      parseIndoDateProp,
    ]);

    // Process single data
    const finalData = useMemo(() => {
      if (!data) return null;
      if (!filterByDate(data)) return null;
      if (debouncedFilterText && !matchesFilter(data, debouncedFilterText))
        return null;
      return data;
    }, [
      data,
      startDate,
      endDate,
      debouncedFilterText,
      matchesFilter,
      parseIndoDateProp,
    ]);

    const totalCount = finalItems.length || (finalData ? 1 : 0);
    const filterLabel = debouncedFilterText
      ? `(HASIL CARI: "${debouncedFilterText}")`
      : '';
    return (
      <div className="flex flex-col h-full min-h-0">
        {(totalCount === 0 || extraLabel || subLabels.length > 0) && (
          <div className="mt-2.5 mb-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg shadow-sm">
            <p className="text-[11px] text-green-900 leading-tight">
              <span className="font-bold underline decoration-green-300 underline-offset-4">
                {totalCount} Data {label}
              </span>
            </p>
            {extraLabel && (
              <p className="text-[10px] text-green-700 mt-1.5 font-medium italic">
                {extraLabel}
              </p>
            )}
            {subLabels.length > 0 && (
              <div className="mt-2 pt-2 border-t border-green-100 flex flex-col gap-1">
                {subLabels.map((sl: string, i: number) => {
                  const isSubItem = /^\d+\./.test(sl.trim());
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-1.5 text-[10px] text-gray-800 leading-tight ${isSubItem ? 'ml-4' : ''}`}
                    >
                      {!isSubItem && (
                        <span className="text-green-600 font-bold shrink-0">
                          •
                        </span>
                      )}
                      <span className="font-medium">{sl}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-0 pb-5 w-full max-w-full overflow-hidden px-1">
          {totalCount === 0 ? (
            <div className="pt-2 pb-4 w-full"></div>
          ) : (
            <>
              {finalItems.map((item: any, idx: number) => (
                <DataCard
                  key={`${item.id || item.faktur || idx}-${idx}`}
                  item={item}
                  highlightText={debouncedFilterText}
                />
              ))}
              {finalData && (
                <DataCard
                  item={finalData}
                  highlightText={debouncedFilterText}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  },
);
RenderColumnContent.displayName = 'RenderColumnContent';
