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
 * Format angka ke format Indonesia: ribuan titik (.) dan desimal koma (,)
 * Contoh: 15700.5 -> "15.700,50"
 */
function formatNumberToIndo(num: number, showDecimals: boolean): string {
  if (num === 0) return showDecimals ? '0,00' : '0';
  if (!num && num !== 0) return '';

  if (showDecimals) {
    const fixed = num.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInt},${decPart}`;
  }

  const [intPart, decPart] = String(num).split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (decPart !== undefined) {
    return `${formattedInt},${decPart}`;
  }
  return formattedInt;
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
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Sinkronisasi saat nilai eksternal berubah dan input tidak sedang aktif diketik
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatNumberToIndo(value, allowDecimals));
    }
  }, [value, isFocused, allowDecimals]);

  const handleFocus = () => {
    setIsFocused(true);
    // Saat fokus, tampilkan angka tanpa trailing zero paksa agar mudah diedit
    setInputValue(formatNumberToIndo(value, false));
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Saat blur, format rapi dengan 2 angka di belakang koma
    setInputValue(formatNumberToIndo(value, allowDecimals));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Hanya izinkan angka, koma, dan titik
    raw = raw.replace(/[^0-9,.]/g, '');

    // Standarisasi desimal: ubah titik menjadi koma jika dimasukkan
    // Jika ada koma, hanya izinkan 1 koma
    const parts = raw.split(/[,.]/);
    let intRaw = parts[0].replace(/\D/g, '');
    let decRaw = parts.length > 1 ? parts.slice(1).join('').replace(/\D/g, '').slice(0, 2) : undefined;

    const formattedInt = intRaw ? intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0';
    const displayStr = decRaw !== undefined ? `${formattedInt},${decRaw}` : formattedInt;

    setInputValue(displayStr);

    const parsedNum = parseFloat(`${intRaw || '0'}.${decRaw || '0'}`);
    onValueChange(isNaN(parsedNum) ? 0 : parsedNum);
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
        inputMode="decimal"
        value={inputValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
