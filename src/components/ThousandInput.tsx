'use client';

import React, { useState, useEffect } from 'react';

interface ThousandInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onValueChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  allowDecimals?: boolean;
}

/**
 * Format persis seperti formatNumberIndo di RecordsForm.tsx:
 * Mengizinkan input koma secara bebas dan memformat ribuan titik secara real-time.
 */
function formatNumberIndo(val: string | number): string {
  if (val === undefined || val === null || val === '') return '';

  const isNumType = typeof val === 'number';
  let s = String(val);
  if (!isNumType) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  }

  const num = parseFloat(s);
  if (isNaN(num)) return String(val);

  const parts = s.split('.');
  let res = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (parts.length > 1) {
    const decimalPart = parts[1].substring(0, 2);
    res += ',' + decimalPart;
  }
  return res;
}

function parseNumberIndo(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export default function ThousandInput({
  value,
  onValueChange,
  prefix,
  suffix,
  allowDecimals = true,
  className = '',
  placeholder = '0',
  disabled,
  ...props
}: ThousandInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('');

  // Sinkronisasi dari prop value luar
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const currentParsed = parseNumberIndo(displayValue);
      // Hanya set jika nilai angka berbeda (mencegah gangguan saat mengetik koma di tengah jalan)
      if (currentParsed !== value || displayValue === '') {
        setDisplayValue(formatNumberIndo(value));
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    if (!allowDecimals) {
      raw = raw.replace(/[^0-9]/g, '');
    } else {
      raw = raw.replace(/[^0-9,]/g, '');
    }

    // Tangani jika ada koma di posisi terakhir saat user baru mengetik koma (contoh: "15.700,")
    if (raw.endsWith(',')) {
      // Pastikan hanya 1 koma
      const parts = raw.split(',');
      if (parts.length <= 2) {
        const intFormatted = parts[0] ? formatNumberIndo(parts[0].replace(/\./g, '')) : '0';
        setDisplayValue(`${intFormatted},`);
        onValueChange(parseNumberIndo(intFormatted));
        return;
      }
    }

    const formatted = formatNumberIndo(raw);
    setDisplayValue(formatted);
    onValueChange(parseNumberIndo(formatted));
  };

  return (
    <div className="relative w-full">
      {prefix && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`${prefix ? 'pl-8' : ''} ${suffix ? 'pr-7' : ''} ${className}`}
        {...props}
      />
      {suffix && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
