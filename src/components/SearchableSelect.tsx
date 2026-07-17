'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Loader2 } from 'lucide-react';

interface SearchableSelectProps {
  label: React.ReactNode;
  name: string;
  options: any[];
  placeholder: string;
  required?: boolean;
  displayFn: (o: any) => string;
  valueFn: (o: any) => string | number;
  defaultValue?: string | number | null;
  dropdownPos?: 'up' | 'down';
  disabled?: boolean;
  onChange?: (val: any) => void;
  noOptionsMessage?: string;
  isLoading?: boolean;
}

export default function SearchableSelect({
  label,
  name,
  options,
  placeholder,
  required,
  displayFn,
  valueFn,
  defaultValue,
  dropdownPos = 'down',
  disabled = false,
  onChange,
  noOptionsMessage,
  isLoading = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (defaultValue !== undefined && defaultValue !== null) {
      const currentId = selected ? String(valueFn(selected)) : '';
      if (String(defaultValue) !== currentId) {
        const found = options.find((o) => String(valueFn(o)) === String(defaultValue));
        if (found) setSelected(found);
        else if (defaultValue === '' || defaultValue === null) setSelected(null);
      }
    } else if (defaultValue === null) {
      setSelected(null);
    }
  }, [defaultValue, options, isLoading, selected, valueFn]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) =>
    displayFn(o).toLowerCase().includes(query.toLowerCase())
  );
  
  const handleSelect = (o: any) => {
    setSelected(o);
    setOpen(false);
    setQuery('');
    if (onChange) onChange(o);
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 mb-1.5 ml-1">{label}{required && <span className="text-red-500 font-bold">*</span>}</label>}
      <input type="hidden" name={name} value={selected ? String(valueFn(selected)) : ''} />
      <div
        className={`w-full bg-white border border-gray-100 rounded-lg px-4 h-11 text-sm flex items-center justify-between transition-all shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-500 focus-within:ring-4 focus-within:ring-green-500/5 focus-within:border-green-500'}`}
        onClick={() => { if (!disabled) { setOpen((o) => !o); setQuery(''); } }}
      >
        <span className={selected ? 'text-gray-800 truncate font-semibold' : 'text-gray-300 font-medium truncate'}>
          {selected ? displayFn(selected) : placeholder}
        </span>
        <ChevronDown size={18} className={`text-gray-300 transition-transform duration-300 ${open ? 'rotate-180 text-green-500' : ''}`} />
      </div>

      {open && !disabled && (
        <div className={`absolute z-[200] w-full bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          dropdownPos === 'up' ? 'bottom-full mb-3' : 'top-full mt-3'
        }`}>
          <div className="p-3 border-b border-gray-50 bg-gray-50/50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full pl-10 pr-3 h-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 bg-white font-medium"
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto custom-scrollbar p-2">
            {!required && (
              <li
                className="px-3 py-2 text-[11px] text-gray-400 hover:bg-gray-50 rounded-lg cursor-pointer italic font-medium mb-1"
                onClick={() => handleSelect(null)}
              >
                — Kosongkan pilihan
              </li>
            )}
            {isLoading ? (
              <li className="px-3 py-10 text-xs text-gray-400 flex flex-col items-center justify-center gap-3">
                <Loader2 size={24} className="animate-spin text-green-500" />
                <span className="font-medium">Memuat data...</span>
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-8 text-xs text-gray-400 italic text-center font-medium">
                {noOptionsMessage || 'Tidak ada hasil'}
              </li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={i}
                  className={`px-4 py-3 text-sm cursor-pointer rounded-lg transition-all mb-1 last:mb-0 border border-transparent ${
                    selected && valueFn(selected) === valueFn(o) 
                      ? 'bg-green-50 text-green-600 border-green-100 font-bold' 
                      : 'text-gray-600 font-medium hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(o)}
                >
                  {displayFn(o)}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
