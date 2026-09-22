// Benchmark unifikasi "1 Buku Soft Cover": dispatcher (klasik + 7 offset) vs:
//  (a) engine langsung per lini (identitas dispatcher), seluruh tier & permutasi;
//  (b) cache Excel untuk lini Klasik (scripts/bsc-expected.json).
// Parity offset-vs-Excel dibuktikan scripts/audit-soft-cover-offset-permutations.ts;
// parity klasik-vs-Excel dibuktikan scripts/audit-buku-soft-cover-permutations.ts.
import { readFileSync } from 'fs';
import {
  calculateSoftCoverUnified,
  DEFAULT_SOFT_COVER_UNIFIED,
  SOFT_COVER_LINI_LABEL,
  softCoverTiers,
  softCoverFinishingOptions,
  SoftCoverLini,
  SoftCoverFinishing,
} from '../src/lib/buku-soft-cover-unified';
import {
  calculateBukuSoftCoverHpp,
  DEFAULT_BUKU_SOFT_COVER_PARAMS,
} from '../src/lib/buku-soft-cover-calculator';
import {
  calculateSoftCoverOffsetHpp,
  defaultSoftCoverOffsetParams,
  SoftCoverOffsetComboId,
} from '../src/lib/buku-soft-cover-offset-calculator';

const D = DEFAULT_SOFT_COVER_UNIFIED;
const LINI = Object.keys(SOFT_COVER_LINI_LABEL) as SoftCoverLini[];
const KLASIK_EXP: any[] = JSON.parse(readFileSync('scripts/bsc-expected.json', 'utf8'));

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, a: number, b: number) => {
  if (a === b) pass++;
  else { fail++; if (fails.length < 20) fails.push(`${label}: unified=${a} ref=${b} selisih=${a - b}`); }
};

// ---------- 1. Klasik via dispatcher vs langsung + vs cache Excel ----------
for (const t of KLASIK_EXP) {
  const inp = { lini: 'Klasik' as SoftCoverLini, oplah: t.H, jumlahHalaman: 32, mukaCover: '1 Muka' as const, warnaCover: '4 Warna' as const, warnaIsi: '1 Warna' as const, finishing: 'Laminasi Glossy,' as SoftCoverFinishing, marginPct: 30 };
  const u = calculateSoftCoverUnified(inp, { ...D });
  const d = calculateBukuSoftCoverHpp(
    { oplah: t.H, varian: '21 x 29,7 cm', jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'Laminasi Glossy,', marginPct: 30 },
    { ...DEFAULT_BUKU_SOFT_COVER_PARAMS });
  check(`klasik@${t.H} DC`, u.totalHpp, d.totalHpp);
  check(`klasik@${t.H} DD`, u.hargaJualPerPcs, d.hargaJualPerPcs);
  check(`klasik@${t.H} CX-excel`, u.totalHpp, Math.round(t.CX));
  check(`klasik@${t.H} DD-excel`, u.hargaJualPerPcs, t.DD);
}

// ---------- 2. Offset via dispatcher vs langsung (7 combo × tier) ----------
for (const lini of LINI) {
  if (lini === 'Klasik') continue;
  const combo = lini as SoftCoverOffsetComboId;
  for (const H of softCoverTiers(lini)) {
    const inp = { lini, oplah: H, jumlahHalaman: 32, mukaCover: '1 Muka' as const, warnaCover: '4 Warna' as const, warnaIsi: '1 Warna' as const, finishing: 'None,' as SoftCoverFinishing, marginPct: 30 };
    const u = calculateSoftCoverUnified(inp, { ...D });
    const d = calculateSoftCoverOffsetHpp(
      { oplah: H, jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'None,', marginPct: 30 },
      { ...defaultSoftCoverOffsetParams(combo) }, combo);
    check(`${lini}@${H} DC`, u.totalHpp, d.totalHpp);
    check(`${lini}@${H} DI`, u.hargaJualPerPcs, d.hargaJualPerPcs);
  }
}

// ---------- 3. Resolusi default per lini ----------
{
  const a = calculateSoftCoverUnified({ lini: 'Klasik', oplah: 20, jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'Laminasi Glossy,', marginPct: 30 }, { ...D });
  check('klasik default umr/insheet/up', a.totalHpp, 933486);
  const b = calculateSoftCoverUnified({ lini: 'Klasik', oplah: 20, jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'Laminasi Glossy,', marginPct: 30 }, { ...D, umr: 3000000 });
  check('klasik override umr menang', b.totalHpp > a.totalHpp ? 1 : 0, 1);
}

console.log(`\nHASIL: ${pass} PASSED, ${fail} FAILED`);
if (fails.length) { console.log('CONTOH GAGAL:'); fails.forEach((x) => console.log('  ' + x)); }
if (fail > 0) process.exit(1);
console.log('AUDIT SOFT COVER UNIFIED: LULUS 100% (0 selisih)');
