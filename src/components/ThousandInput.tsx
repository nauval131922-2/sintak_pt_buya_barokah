'use client';

import React from 'react';

interface ThousandInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onValueChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
}

export default function ThousandInput({
  value,
  onValueChange,
  prefix,
  suffix,
  className = '',
  placeholder = '0',
  disabled,
  ...props
}: ThousandInputProps) {
  const formatDisplay = (num: number) => {
    if (num === 0 && placeholder) return '0';
    if (!num && num !== 0) return '';
    return Math.round(num).toLocaleString('id-ID');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);
    onValueChange(num);
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
        inputMode="numeric"
        value={formatDisplay(value)}
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
