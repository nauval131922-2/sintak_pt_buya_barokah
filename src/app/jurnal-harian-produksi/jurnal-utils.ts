// Pure helpers for Jurnal Harian Produksi client.
// Extracted from JurnalClient.tsx to keep the main component focused and to make
// these testable in isolation. ponytail: no behaviour change, just relocation.

export function formatIndoDateStr(tglStr: string): string {
  if (!tglStr) return '';
  const parts = tglStr.split('-');
  if (parts.length === 3) {
    const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return tglStr;
}

export function evaluateMathExpression(expr: string): string {
  if (!expr.startsWith('=')) return expr;

  const rawFormula = expr.substring(1).trim();
  if (!rawFormula) return expr;

  // Hapus semua spasi
  const formula = rawFormula.replace(/\s+/g, '');

  // Helper untuk menormalkan angka berformat Indonesia/Inggris ke format standar JS
  const normalizeNumberString = (numStr: string): string => {
    if (numStr.includes(',')) {
      const cleanDots = numStr.replace(/\./g, '');
      return cleanDots.replace(/,/g, '.');
    }
    const dotCount = (numStr.match(/\./g) || []).length;
    if (dotCount > 1) {
      return numStr.replace(/\./g, '');
    }
    if (dotCount === 1) {
      if (/\.\d{3}$/.test(numStr)) {
        return numStr.replace(/\./g, '');
      } else {
        return numStr;
      }
    }
    return numStr;
  };

  // Normalisasi semua angka di dalam formula
  const processedFormula = formula.replace(/[0-9.,]+/g, (match) => {
    return normalizeNumberString(match);
  });

  // Validasi karakter aman untuk evaluasi matematika: digit, +, -, *, /, (, ), .
  if (!/^[0-9+\-*/().]+$/.test(processedFormula)) {
    return expr;
  }

  try {
    // Evaluasi ekspresi matematika dengan aman
    const result = Function(`"use strict"; return (${processedFormula})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      const isInteger = Number.isInteger(result);
      if (isInteger) {
        return String(result).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      } else {
        const parts = String(Number(result.toFixed(4))).split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return parts[1] ? `${integerPart},${parts[1]}` : integerPart;
      }
    }
  } catch (e) {
    // Abaikan error parsing dan kembalikan nilai asli
  }

  return expr;
}

export function formatFormulaNumbers(val: string): string {
  if (!val.startsWith('=')) return val;

  const rawFormula = val.substring(1);

  return '=' + rawFormula.replace(/[0-9.,]+/g, (numStr) => {
    if (numStr === '.' || numStr === ',') return numStr;

    if (numStr.includes(',')) {
      const parts = numStr.split(',');
      const integerPart = parts[0].replace(/\./g, '');
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const decimalPart = parts.slice(1).join(',').replace(/\./g, '');
      return `${formattedInteger},${decimalPart}`;
    } else {
      const cleanInt = numStr.replace(/\./g, '');
      return cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  });
}
