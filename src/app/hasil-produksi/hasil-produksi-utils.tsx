'use client';

import React from 'react';

// Helper to format date strings to DD MMM YYYY (Indonesian)
export const formatToDayMonthYear = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    let date: Date;
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
      // YYYY-MM-DD (ISO style from Jurnal)
      date = new Date(dateStr);
    } else if (dateStr.includes('-')) {
      // DD-MM-YYYY (from Gudang)
      const [d, m, y] = dateStr.split('-');
      date = new Date(`${y}-${m}-${d}`);
    } else {
      return dateStr;
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export const formatCellVal = (val: any) => {
  if (val === null || val === undefined || val === '') {
    return <div className="text-right tabular-nums">0</div>;
  }
  const isNum = !isNaN(Number(val));
  const display = isNum ? Number(val).toLocaleString('id-ID') : String(val);
  return (
    <div className={`whitespace-pre-wrap ${isNum ? 'text-right tabular-nums' : 'text-left'}`}>
      {display}
    </div>
  );
};
