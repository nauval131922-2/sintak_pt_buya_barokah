'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { highlightText } from '@/lib/highlight';
import { toast } from '@/lib/toast';

interface SearchResult {
  type: string;
  id: string;
  label: string;
  source: string;
  category?: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll active item into view inside dropdown
  useEffect(() => {
    if (selectedIndex >= 0 && activeItemRef.current && dropdownRef.current) {
      const activeEl = activeItemRef.current;
      const dropdownEl = dropdownRef.current;

      const activeTop = activeEl.offsetTop;
      const activeHeight = activeEl.offsetHeight;
      const dropdownScrollTop = dropdownEl.scrollTop;
      const dropdownHeight = dropdownEl.offsetHeight;

      if (activeTop < dropdownScrollTop) {
        dropdownEl.scrollTop = activeTop - 10;
      } else if (activeTop + activeHeight > dropdownScrollTop + dropdownHeight) {
        dropdownEl.scrollTop = activeTop + activeHeight - dropdownHeight + 10;
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          console.error('Search API error:', res.status);
          setResults([]);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
        setSelectedIndex(-1);
        setIsLoading(false);
      } catch (e) {
        console.error('Search failed:', e);
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger search on "/" key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && !/^(INPUT|TEXTAREA)$/i.test(document.activeElement?.tagName || '') && !(document.activeElement as HTMLElement)?.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // ESC to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation (Arrow Up/Down, Enter)
  const handleKeyNavigation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    }
  };

  const handleSelectResult = (item: SearchResult) => {
    if (item.source === 'menu') {
      router.push(item.id);
    } else {
      // Route to detail pages with query params for filtering/highlighting
      switch (item.source) {
        case 'purchase_orders':
          router.push(`/purchase-orders?search=${encodeURIComponent(item.id)}&highlight=${encodeURIComponent(query)}`);
          break;
        case 'sales_orders':
          router.push(`/sales-orders?search=${encodeURIComponent(item.id)}&highlight=${encodeURIComponent(query)}`);
          break;
        case 'bahan_baku':
          router.push(`/data-digit/stok/master-barang?search=${encodeURIComponent(item.label)}&highlight=${encodeURIComponent(query)}`);
          break;
        case 'employees':
          router.push(`/employees?search=${encodeURIComponent(item.label)}&highlight=${encodeURIComponent(query)}`);
          break;
        case 'orders':
          router.push(`/orders?search=${encodeURIComponent(item.id)}&highlight=${encodeURIComponent(query)}`);
          break;
        case 'purchase_requests':
          router.push(`/pr?search=${encodeURIComponent(item.id)}&highlight=${encodeURIComponent(query)}`);
          break;
        case 'produksi_selesai':
          router.push(`/data-digit/produksi/produksi-selesai?search=${encodeURIComponent(item.id)}&highlight=${encodeURIComponent(query)}`);
          break;
        case 'sph_out':
          router.push(`/sph-out?search=${encodeURIComponent(item.id)}&highlight=${encodeURIComponent(query)}`);
          break;
        case 'jurnal_harian_produksi':
          router.push(`/jurnal-harian-produksi?search=${encodeURIComponent(item.label)}&highlight=${encodeURIComponent(query)}`);
          break;
        default:
          // Fallback untuk source yang belum di-handle
          toast.info(`Detail ${item.type}: ${item.label}`);
      }
    }
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleClearQuery = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Cari menu, PO, SO, barang, karyawan..."
          className="w-full pl-10 pr-12 py-2.5 border rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-300 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-sm transition-all font-medium placeholder-slate-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyNavigation}
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
          <Search size={16} />
        </div>
        
        {/* Loading spinner or Clear button or Slash key hint */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : query ? (
            <button
              onClick={handleClearQuery}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-100"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md shadow-sm pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-[9999] w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden max-h-[420px] overflow-y-auto divide-y divide-slate-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              Tidak ada hasil untuk &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Group by source: Menu first, then Data */}
              {results.some(r => r.source === 'menu') && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400r">
                    Menu Navigasi
                  </div>
                  {results
                    .filter(r => r.source === 'menu')
                    .map((item, idx) => {
                      const actualIndex = results.indexOf(item);
                      const isSelected = selectedIndex === actualIndex;
                      return (
                        <div
                          key={`menu-${idx}`}
                          ref={isSelected ? activeItemRef : null}
                          className={`mx-2 my-0.5 px-3 py-2 rounded-lg cursor-pointer flex justify-between items-center transition-all ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-950 font-medium'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                          onClick={() => handleSelectResult(item)}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-semibold text-xs truncate leading-snug">
                              {highlightText(item.label, query)}
                            </span>
                            {item.category && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {highlightText(item.category, query)}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-2 py-0.5 rounded-md font-bold shrink-0 ml-2">
                            {item.type}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
              
              {results.some(r => r.source !== 'menu') && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400r">
                    Data Master & Transaksi
                  </div>
                  {results
                    .filter(r => r.source !== 'menu')
                    .map((item, idx) => {
                      const actualIndex = results.indexOf(item);
                      const isSelected = selectedIndex === actualIndex;
                      const isPoOrSo = item.type === 'PO' || item.type === 'SO';
                      const badgeBg = isPoOrSo 
                        ? 'bg-blue-50 text-blue-700 border-blue-100/50' 
                        : item.type === 'Karyawan' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100/50' 
                        : item.type === 'JHP'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                        : 'bg-amber-50 text-amber-700 border-amber-100/50';

                      return (
                        <div
                          key={`data-${idx}`}
                          ref={isSelected ? activeItemRef : null}
                          className={`mx-2 my-0.5 px-3 py-2 rounded-lg cursor-pointer flex justify-between items-center transition-all ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-950 font-medium'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                          onClick={() => handleSelectResult(item)}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-bold text-xs truncate leading-snug">
                              {highlightText(item.label, query)}
                            </span>
                            {item.category && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {highlightText(item.category, query)}
                              </span>
                            )}
                          </div>
                          <span className={`text-[9px] border px-2 py-0.5 rounded-md font-bold shrink-0 ml-2 ${badgeBg}`}>
                            {item.type}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
