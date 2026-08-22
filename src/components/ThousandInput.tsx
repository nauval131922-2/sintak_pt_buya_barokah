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
 * Format angka ke standar Indonesia:
 * - Menghilangkan leading zero yang tidak perlu (misal '05' jadi '5', kecuali '0,' untuk desimal).
 * - Pemisah ribuan titik (.) dan desimal koma (,) tanpa membatasi jumlah digit desimal.
 */
function formatNumberIndo(val: string | number): string {
  if (val === undefined || val === null || val === '') return '';

  const isNumType = typeof val === 'number';
  let s = String(val);
  if (!isNumType) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  }

  const parts = s.split('.');
  // Hilangkan leading zero pada bagian bulat jika angka bukan '0' tunggal
  let intStr = parts[0];
  if (intStr.length > 1 && intStr.startsWith('0')) {
    intStr = intStr.replace(/^0+/, '') || '0';
  }

  const formattedInt = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (parts.length > 1) {
    const decimalPart = parts[1]; // fleksibel tanpa limit digit
    return `${formattedInt},${decimalPart}`;
  }
  return formattedInt;
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
  onFocus,
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

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) onFocus(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Jika allowDecimals aktif dan user menekan tombol '.' (titik / numpad dot),
    // otomatis ubah jadi koma (',') seperti perilaku input number desimal
    if (allowDecimals && (e.key === '.' || e.key === 'Decimal')) {
      e.preventDefault();
      const input = e.currentTarget;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const val = input.value;

      // Jika belum ada koma, masukkan koma
      if (!val.includes(',')) {
        const nextVal = val.slice(0, start) + ',' + val.slice(end);
        let intPart = nextVal.split(',')[0].replace(/\./g, '');
        if (intPart.length > 1 && intPart.startsWith('0')) {
          intPart = intPart.replace(/^0+/, '') || '0';
        }
        const intFormatted = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0';
        const finalDisplay = `${intFormatted},`;
        setDisplayValue(finalDisplay);
        onValueChange(parseNumberIndo(intFormatted));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    if (!allowDecimals) {
      raw = raw.replace(/[^0-9]/g, '');
    } else {
      raw = raw.replace(/[^0-9,]/g, '');
    }

    if (raw === '') {
      setDisplayValue('');
      onValueChange(0);
      return;
    }

    // Tangani jika ada koma di posisi terakhir saat user baru mengetik koma (contoh: "15.700,")
    if (raw.endsWith(',')) {
      const parts = raw.split(',');
      if (parts.length <= 2) {
        let intPart = parts[0].replace(/\./g, '');
        if (intPart.length > 1 && intPart.startsWith('0')) {
          intPart = intPart.replace(/^0+/, '') || '0';
        }
        const intFormatted = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0';
        setDisplayValue(`${intFormatted},`);
        onValueChange(parseNumberIndo(intFormatted));
        return;
      }
    }

    // Jika user mengetik angka di belakang '0' tanpa koma (misal awalnya '0' lalu ketik '5' -> '05'), otomatis jadikan '5'
    if (!raw.includes(',')) {
      const cleanInt = raw.replace(/\./g, '');
      if (cleanInt.length > 1 && cleanInt.startsWith('0')) {
        raw = cleanInt.replace(/^0+/, '') || '0';
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
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
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
