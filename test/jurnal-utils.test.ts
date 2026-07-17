import { describe, it, expect } from 'vitest';
import { formatIndoDateStr, evaluateMathExpression, formatFormulaNumbers } from '../src/app/jurnal-harian-produksi/jurnal-utils';

describe('evaluateMathExpression', () => {
  it('returns non-formula strings unchanged', () => {
    expect(evaluateMathExpression('bukan formula')).toBe('bukan formula');
    expect(evaluateMathExpression('123')).toBe('123');
    expect(evaluateMathExpression('')).toBe('');
  });

  it('evaluates simple integer math with Indonesian number formatting', () => {
    expect(evaluateMathExpression('=2+3')).toBe('5');
    expect(evaluateMathExpression('=10*5')).toBe('50'); // 50 (< 1000, no sep)
    expect(evaluateMathExpression('=100/4')).toBe('25');
  });

  it('evaluates decimals and formats with comma', () => {
    expect(evaluateMathExpression('=1,5+2,5')).toBe('4'); // normalized to 1.5+2.5=4
    expect(evaluateMathExpression('=10/3')).toBe('3,3333'); // toFixed(4) -> comma decimal
  });

  it('normalizes dotted thousands in formula', () => {
    expect(evaluateMathExpression('=1.000+500')).toBe('1.500');
  });

  it('returns original on unsafe characters (injection guard)', () => {
    expect(evaluateMathExpression('=1+alert(1)')).toBe('=1+alert(1)');
    expect(evaluateMathExpression('=1;process.exit()')).toBe('=1;process.exit()');
  });
});

describe('formatFormulaNumbers', () => {
  it('returns non-formula unchanged', () => {
    expect(formatFormulaNumbers('biasa')).toBe('biasa');
  });

  it('reformats numbers inside a formula string with thousand separators', () => {
    expect(formatFormulaNumbers('=1000+2000')).toBe('=1.000+2.000');
  });

  it('keeps the leading = and decimals', () => {
    expect(formatFormulaNumbers('=1,5*2')).toBe('=1,5*2');
  });
});

describe('formatIndoDateStr', () => {
  it('formats YYYY-MM-DD into id-ID short date', () => {
    expect(formatIndoDateStr('2026-03-27')).toBe('27 Mar 2026');
  });

  it('returns empty / original for invalid', () => {
    expect(formatIndoDateStr('')).toBe('');
    expect(formatIndoDateStr('bukan-tanggal')).toBe('bukan-tanggal');
  });
});
