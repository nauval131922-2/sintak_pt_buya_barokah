'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
      if (e.key === '/' && document.activeElement !== inputRef.current) {
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
          router.push(`/purchase-orders?search=${encodeURIComponent(item.id)}`);
          break;
        case 'sales_orders':
          router.push(`/sales-orders?search=${encodeURIComponent(item.id)}`);
          break;
        case 'bahan_baku':
          router.push(`/data-digit/stok/master-barang?search=${encodeURIComponent(item.label)}`);
          break;
        case 'employees':
          router.push(`/employees?search=${encodeURIComponent(item.label)}`);
          break;
        case 'orders':
          router.push(`/orders?search=${encodeURIComponent(item.id)}`);
          break;
        case 'purchase_requests':
          router.push(`/pr?search=${encodeURIComponent(item.id)}`);
          break;
        default:
          // Fallback untuk source yang belum di-handle
          alert(`Detail ${item.type}: ${item.label}`);
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
          placeholder="Find everything..."
          className="w-full pl-10 pr-10 py-2 border rounded-xl border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyNavigation}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded">
            /
          </kbd>
        </div>
        
        {/* Loading spinner or Clear button */}
        {query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <button
                onClick={handleClearQuery}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-2 bg-white border border-emerald-100 rounded-xl shadow-lg overflow-hidden max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Tidak ada hasil untuk &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Group by source: Menu first, then Data */}
              {results.some(r => r.source === 'menu') && (
                <>
                  <div className="px-4 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Menu
                  </div>
                  {results
                    .filter(r => r.source === 'menu')
                    .map((item, idx) => {
                      const actualIndex = results.indexOf(item);
                      return (
                        <div
                          key={`menu-${idx}`}
                          className={`px-4 py-2.5 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0 transition-colors ${
                            selectedIndex === actualIndex
                              ? 'bg-emerald-100'
                              : 'hover:bg-emerald-50'
                          }`}
                          onClick={() => handleSelectResult(item)}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-medium text-gray-800 truncate">{item.label}</span>
                            {item.category && (
                              <span className="text-xs text-gray-400">{item.category}</span>
                            )}
                          </div>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium shrink-0 ml-2">
                            {item.type}
                          </span>
                        </div>
                      );
                    })}
                </>
              )}
              
              {results.some(r => r.source !== 'menu') && (
                <>
                  <div className="px-4 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Data
                  </div>
                  {results
                    .filter(r => r.source !== 'menu')
                    .map((item, idx) => {
                      const actualIndex = results.indexOf(item);
                      return (
                        <div
                          key={`data-${idx}`}
                          className={`px-4 py-2.5 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0 transition-colors ${
                            selectedIndex === actualIndex
                              ? 'bg-emerald-100'
                              : 'hover:bg-emerald-50'
                          }`}
                          onClick={() => handleSelectResult(item)}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-medium text-gray-800 truncate">{item.label}</span>
                            {item.category && (
                              <span className="text-xs text-gray-400">{item.category}</span>
                            )}
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium shrink-0 ml-2">
                            {item.type}
                          </span>
                        </div>
                      );
                    })}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
