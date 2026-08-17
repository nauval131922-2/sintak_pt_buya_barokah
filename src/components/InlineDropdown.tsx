'use client';

import { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';
import Portal, { getZoomScale } from './Portal';
import { ChevronDown, Search } from 'lucide-react';

interface InlineOption {
  value: string;
  label: string;
  key?: string;
  meta?: Record<string, any>;
}

interface InlineDropdownProps {
  value: string;
  options: InlineOption[];
  onChange: (value: string, option: InlineOption) => void;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  freeInput?: boolean;
  maxRender?: number;
}

function useLatestRef<T>(val: T) {
  const ref = useRef(val);
  ref.current = val;
  return ref;
}

export default function InlineDropdown({
  value, options, onChange, placeholder = '', className = '',
  searchable = false, freeInput = false, maxRender = 50,
}: InlineDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refs to avoid stale closures in event handlers + effect
  const valueRef = useLatestRef(value);
  const onChangeRef = useLatestRef(onChange);
  const freeInputRef = useLatestRef(freeInput);
  const setSearchQueryRef = useLatestRef(setSearchQuery);

  useEffect(() => { setMounted(true); }, []);

  const matchedOption = useMemo(() => options.find(o => o.value === value), [options, value]);

  const selectedLabel = useMemo(
    () => matchedOption?.label || value || placeholder,
    [matchedOption, value, placeholder]
  );

  const effectiveQuery = freeInput ? inputValue : searchQuery;

  const filteredOptions = useMemo(() => {
    if (!effectiveQuery) return options;
    const q = effectiveQuery.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, effectiveQuery]);

  const displayOptions = useMemo(
    () => filteredOptions.slice(0, maxRender),
    [filteredOptions, maxRender]
  );

  // Hitung posisi dropdown dari trigger button
  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = getZoomScale();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownMaxH = 240; // max-h kira-kira

    const showAbove = spaceBelow < dropdownMaxH && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left / scale,
      width: Math.max(rect.width / scale, 200),
      zIndex: 99999,
      ...(showAbove
        ? { bottom: (window.innerHeight - rect.top + 4) / scale }
        : { top: (rect.bottom + 4) / scale }
      ),
    });
  }, []);

  const handleCommit = useCallback((finalValue?: string) => {
    if (!freeInputRef.current) return;
    const v = finalValue ?? inputValue;
    // Jika inputValue kosong (user tidak mengetik apapun), pertahankan value lama
    if (v === '') return;
    if (v !== valueRef.current) {
      const matchedOpt = options.find(o => o.value === v) ?? { value: v, label: v };
      onChangeRef.current(v, matchedOpt);
    }
  }, [inputValue, options]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    if (freeInputRef.current) handleCommit();
    setIsOpen(false);
    setSearchQueryRef.current('');
  }, [handleCommit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click-outside handler: cukup 1 listener per dropdown, bukan per document
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      // Cek apakah klik di dalam trigger atau di dalam portal dropdown
      if (containerRef.current?.contains(target)) return;
      // Cek data-attribute untuk portal dropdown
      const portalEl = document.querySelector(`[data-inline-dropdown-portal="${containerRef.current?.dataset.dropdownId}"]`);
      if (portalEl?.contains(target)) return;
      handleClose();
    }
    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    return () => document.removeEventListener('mousedown', handleClickOutside, { capture: true });
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen && (searchable || freeInput)) {
      inputRef.current?.focus();
      // freeInput: kosongkan input agar semua options tampil (tidak difilter ke value terselect)
      // value tetap terpilih di list (highlight), tapi filter dimulai kosong
      if (freeInput) setInputValue('');
    }
  }, [isOpen, searchable, freeInput, value]);

  // Generate stable ID for this dropdown instance
  const dropdownId = useId();

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition();
      setFocusedIndex(-1);
    } else {
      if (freeInputRef.current) handleCommit();
    }
    setIsOpen(prev => !prev);
  };

  const handleSelect = useCallback((opt: InlineOption) => {
    onChangeRef.current(opt.value, opt);
    setIsOpen(false);
    setSearchQueryRef.current('');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (freeInput) {
      setInputValue(e.target.value);
    } else {
      setSearchQuery(e.target.value);
    }
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = displayOptions;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && focusedIndex < items.length) {
        e.preventDefault();
        handleSelect(items[focusedIndex]);
      } else if (freeInput) {
        handleCommit();
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const inputPlaceholder = freeInput ? placeholder : 'Cari...';

  // ponytail: render lewat <Portal> (bukan createPortal mentah) karena koordinat dropdownStyle
  // sudah dibagi getZoomScale — tanpa wrapper zoom Portal, posisi meleset ~22% di layar ber-zoom.
  const dropdownContent = isOpen && mounted ? (
    <Portal>
      <div
        data-inline-dropdown-portal={dropdownId}
        style={dropdownStyle}
        className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
      >
        {(searchable || freeInput) && (
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={freeInput ? inputValue : searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                placeholder={inputPlaceholder}
              />
            </div>
          </div>
        )}
        <div className="max-h-[200px] overflow-y-auto">
          {displayOptions.length > 0 ? displayOptions.map((opt, i) => (
            <button
              key={opt.key ?? opt.value}
              type="button"
              onMouseDown={e => { e.preventDefault(); handleSelect(opt); }}
              onMouseEnter={() => setFocusedIndex(i)}
              className={`w-full text-left px-3 py-1.5 text-[11px] font-bold transition-colors ${
                opt.value === value
                  ? 'bg-emerald-50 text-emerald-700'
                  : i === focusedIndex ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          )) : freeInput ? null : (
            <div className="px-3 py-4 text-[11px] text-gray-400 text-center">Tidak ditemukan</div>
          )}
        </div>
      </div>
    </Portal>
  ) : null;

  return (
    <div
      className="relative inline-block"
      ref={containerRef}
      data-dropdown-id={dropdownId}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1 px-2 py-1 text-[11px] font-bold border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-all outline-none focus:ring-2 focus:ring-emerald-500/10 ${
          !value && placeholder ? 'text-gray-400' : 'text-gray-800'
        } ${className}`}
      >
        <span className="truncate max-w-[100px]">{selectedLabel}</span>
        <ChevronDown size={12} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownContent}
    </div>
  );
}
