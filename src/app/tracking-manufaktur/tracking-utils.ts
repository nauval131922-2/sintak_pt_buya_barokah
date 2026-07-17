// Pure helpers for Tracking Manufaktur client.
// Extracted from TrackingClient.tsx to keep the main component focused and testable.
// ponytail: no behaviour change, just relocation.

// Unified date formatter for MDT Host source data (YYYY-MM-DD -> DD-MM-YYYY)
export const formatMdtDate = (str: string): string => {
  if (!str) return '-';
  const clean = str.trim();
  if (/^\d{2}-\d{2}-\d{4}/.test(clean)) return clean; // Already DD-MM-YYYY
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})(.*)/);
  if (match) {
    const [_, y, m, d, rest] = match;
    const time = rest.trim().slice(0, 5); // Take HH:mm if available
    return `${d}-${m}-${y}${time ? ' ' + time : ''}`;
  }
  return clean;
};

// Helper to parse DD-MM-YYYY or DD/MM/YYYY to Date object
export const parseIndoDate = (tglStr: string): Date | null => {
  if (!tglStr || typeof tglStr !== 'string') return null;
  // Clean up string and handle different separators
  const cleanStr = tglStr.trim().replace(/\//g, '-');
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return null;

  let day, month, year;

  // Detect format: YYYY-MM-DD or DD-MM-YYYY
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    year = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    day = parseInt(parts[2]);
  } else {
    // DD-MM-YYYY
    day = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    year = parseInt(parts[2]);
  }

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

export const parseLooseNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;

  const plain = String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  if (!plain) return 0;

  const match = plain.match(/-?\d[\d.,]*/);
  if (!match) return 0;

  const normalized = match[0].replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const toTitleCase = (str: string): string => {
  const abbreviations: Record<string, string> = {
    kd: 'Kode',
    brg: 'Barang',
    qty: 'Qty',
    ppn: 'PPN',
    hp: 'HP',
    bbb: 'BBB',
    btkl: 'BTKL',
    bop: 'BOP',
    so: 'SO',
    pr: 'PR',
    op: 'OP',
    bom: 'BOM',
    sph: 'SPH',
    spph: 'SPPH',
    po: 'PO',
    mtd: 'Metode',
    regu: 'Regu',
    wip: 'WIP',
    id: 'ID',
  };

  return str
    .split('_')
    .map((word) => {
      const lower = word.toLowerCase();
      return (
        abbreviations[lower] ||
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      );
    })
    .join(' ');
};
