// Benchmark parity Buku Soft Cover 21x29,7 vs cache Excel (BUKU!H7:H18, DD7:DD18 + komponen).
// Expected: scripts/bsc-expected.json (hasil cache formula Excel, BUKAN hitungan SINTAK).
import { readFileSync } from 'fs';
import {
  calculateBukuSoftCoverHpp,
  DEFAULT_BUKU_SOFT_COVER_PARAMS,
  BUKU_SOFT_COVER_TIERS,
  BukuSoftCoverMukaCoverType,
  BukuSoftCoverWarnaCoverType,
  BukuSoftCoverWarnaIsiType,
  BukuSoftCoverFinishingType,
} from '../src/lib/buku-soft-cover-calculator';

const EXPECTED: any[] = JSON.parse(readFileSync('scripts/bsc-expected.json', 'utf8'));
const D = DEFAULT_BUKU_SOFT_COVER_PARAMS;

const COMP: Record<string, string> = {
  'Cetak Cover Print Inter': 'T', 'Desain Cover': 'V', 'Kertas Isi HVS': 'AR',
  'Desain Isi': 'AT', 'Plate Isi Oliver': 'AW', Royalty: 'BF', 'Jasa Susun': 'BI',
  Steples: 'BJ', Sisir: 'BL', Bending: 'BX', 'Laminasi Glossy': 'CB',
  'Laminasi Doff': 'CE', 'UV Varnish': 'CH', 'UV Varnish + Bending': 'CJ',
  'Laminasi Doff + Bending': 'CL',
};

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, a: number, b: number) => {
  if (a === b) pass++;
  else { fail++; if (fails.length < 20) fails.push(`${label}: sintak=${a} excel=${b} selisih=${a - b}`); }
};

// ---------- 1. PARITY saved-state (32 hal, 1 Muka, 4 Warna cover, 1 Warna isi, Glossy, margin 30) ----------
for (const t of EXPECTED) {
  const r = calculateBukuSoftCoverHpp(
    { oplah: t.H, varian: '21 x 29,7 cm', jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'Laminasi Glossy,', marginPct: 30 },
    { ...D });
  check(`@${t.H} R`, r.kebutuhanKertasCover, t.R);
  check(`@${t.H} Q`, r.kebutuhanCetakCover, t.Q);
  check(`@${t.H} AP`, r.kebutuhanPlanoIsi, t.AP);
  for (const item of r.breakdown) {
    const key = item.nama.startsWith('Cetak Isi') ? 'Cetak Isi' : item.nama;
    if (key === 'Cetak Isi') { check(`@${t.H} BD`, item.nominal, Math.round(t.BD)); continue; }
    if (key === 'Tambahan Cetak Isi') { check(`@${t.H} BH`, item.nominal, Math.round(t.BH)); continue; }
    const exp = t[COMP[key]];
    if (exp !== null && exp !== undefined) check(`@${t.H} ${item.nama}`, item.nominal, Math.round(exp));
  }
  check(`@${t.H} CX`, r.totalHpp, Math.round(t.CX));
  check(`@${t.H} DD`, r.hargaJualPerPcs, t.DD);
}

// ---------- 2. ORACLE independen untuk permutasi ----------
function oracle(o: {
  H: number; hal: number; muka: BukuSoftCoverMukaCoverType; wc: BukuSoftCoverWarnaCoverType;
  wi: BukuSoftCoverWarnaIsiType; fin: BukuSoftCoverFinishingType; margin: number; p: typeof D;
}) {
  const M = o.muka === '1 Muka' ? 1 : 2;
  const Z2 = Number(o.wc[0]);
  const AJ = Number(o.wi[0]);
  const Pg = o.hal <= 100 ? 0 : o.hal <= 200 ? 0.7 : o.hal <= 300 ? 1.5 : o.hal <= 400 ? 2 : o.hal <= 500 ? 2.5 : o.hal <= 600 ? 2.5 : 2.8;
  const tgt = o.hal <= 20 ? 900 : o.hal <= 30 ? 900 : o.hal <= 40 ? 800 : o.hal <= 50 ? 800 : o.hal <= 60 ? 800 : o.hal <= 70 ? 800 : o.hal >= 71 ? 700 : 900;
  const R = o.H > 0 ? o.H + o.p.insheetCover : 0;
  const Q = R * M;
  const T = o.p.tarifPrintCoverA3 * R;
  const V = o.H > 0 ? o.p.tarifDesainCover : 0;
  const AI = o.H > 0 ? o.p.insheetIsi : 0;
  const AN = o.hal / 8;
  const AN6 = Math.ceil(AN);
  const AO = ((o.H / 2) * AN + (AI / 2) * AN6) * 2;
  const AP = o.H > 0 ? ((o.H / 2) * AN + (AI / 2) * AN6) : 0;
  const rimIsi = ((65 * 100) * o.p.gramaturIsi) / 20000 * (o.p.tarifKertasIsiKg * (1 + o.p.upIsiPct / 100));
  const AR = (AP / 500) * rimIsi;
  const AT = o.H > 0 ? o.p.tarifDesainIsiPerHlm * o.hal : 0;
  const AW = o.p.tarifPlateIsi;
  const BB = (o.H + AI - 1000) > 1 ? (o.H + AI - 1000) : 0;
  const BD = BB * o.p.tarifDrekIsi + o.p.tarifCetakMinIsi;
  const BH = o.H > 0 ? (AO * 2 - 1000) * o.p.tarifDrekIsi : 0;
  const BI = o.H * ((o.p.umr / 25) / tgt);
  const BJ = (o.p.tarifSteplesPack / (1000 / 3)) * o.H;
  const BL = o.H * o.p.tarifSisirPerPcs;
  const luas = (21 * 2 + 1) * (29.7 + 1);
  const fl = (raw: number) => (raw === 0 ? 0 : raw > o.p.minFinishing ? raw : o.p.minFinishing);
  const BY = o.p.tarifBending * 29.7 * Pg * o.H;
  const BZ = BY === 0 ? 0 : BY > o.p.minBending ? BY : o.p.minBending;
  const bendOn = o.fin === 'Lem Bending,';
  const BX = bendOn ? BY : 0;
  const CB = o.fin === 'Laminasi Glossy,' ? fl(luas * o.p.tarifLaminasiGlossy * o.H) : 0;
  const CE = o.fin === 'Laminasi Doff,' ? fl(luas * o.p.tarifLaminasiDoff * o.H) : 0;
  const rawUV = luas * o.p.tarifUvVarnish * o.H;
  const CH = o.fin === 'UV Varnish,' ? fl(rawUV) : 0;
  const CJ = o.fin === 'UV Varnish + Bending,' ? fl(rawUV) + BZ : 0;
  const CL = o.fin === 'Laminasi Doff + Bending,' ? fl(luas * o.p.tarifLaminasiDoff * o.H) + BZ : 0;
  const CX = T + V + AR + AT + AW + BD + BH + BI + BJ + BL + BX + CB + CE + CH + CJ + CL;
  const CY = o.H > 0 ? CX / o.H : 0;
  const DD = o.H > 0 ? Math.ceil((CY * (1 + o.margin / 100)) / 10) * 10 : 0;
  return { CX: Math.round(CX), DD };
}

const MUKAS: BukuSoftCoverMukaCoverType[] = ['1 Muka', '2 Muka'];
const WCS: BukuSoftCoverWarnaCoverType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
const WIS: BukuSoftCoverWarnaIsiType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
const FINS: BukuSoftCoverFinishingType[] = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,', 'Lem Bending,', 'UV Varnish + Bending,', 'Laminasi Doff + Bending,'];
let permCount = 0;
for (const H of [20, 100, 500]) {
  for (const hal of [32, 120]) {
    for (const muka of MUKAS)
      for (const wc of WCS)
        for (const wi of WIS)
          for (const fin of FINS) {
            permCount++;
            const p = { ...D };
            const r = calculateBukuSoftCoverHpp({ oplah: H, varian: '21 x 29,7 cm', jumlahHalaman: hal, mukaCover: muka, warnaCover: wc, warnaIsi: wi, finishing: fin, marginPct: 30 }, p);
            const e = oracle({ H, hal, muka, wc, wi, fin, margin: 30, p });
            check(`perm @${H}/${hal} ${muka}/${wc}/${wi}/${fin} CX`, r.totalHpp, e.CX);
            check(`perm @${H}/${hal} ${muka}/${wc}/${wi}/${fin} DD`, r.hargaJualPerPcs, e.DD);
          }
  }
}

// ---------- 3. REAKTIVITAS ----------
const base = (H: number, hal = 32, extra: any = {}) => calculateBukuSoftCoverHpp(
  { oplah: H, varian: '21 x 29,7 cm', jumlahHalaman: hal, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'Laminasi Glossy,', marginPct: 30, ...extra }, { ...D });
const react = (label: string, H: number, patch: Partial<typeof D>, target: 'hpp' | 'jual' = 'hpp', extra: any = {}, hal = 32) => {
  const a = base(H, hal, extra);
  const b = calculateBukuSoftCoverHpp(
    { oplah: H, varian: '21 x 29,7 cm', jumlahHalaman: hal, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'Laminasi Glossy,', marginPct: 30, ...extra },
    { ...D, ...patch });
  const d = target === 'hpp' ? b.totalHpp - a.totalHpp : b.hargaJualPerPcs - a.hargaJualPerPcs;
  check(`reaktif ${label} Δ>0`, d > 0 ? 1 : 0, 1);
};
react('insheetCover', 50, { insheetCover: 10 });
react('desainCover', 50, { tarifDesainCover: 25000 });
react('printA3', 50, { tarifPrintCoverA3: 3000 });
react('kertasIsi', 50, { tarifKertasIsiKg: 17000 });
react('upIsi', 50, { upIsiPct: 6 });
react('gramIsi', 50, { gramaturIsi: 80 });
react('insheetIsi', 50, { insheetIsi: 150 });
react('desainHlm', 50, { tarifDesainIsiPerHlm: 18000 });
react('plateIsi', 50, { tarifPlateIsi: 50000 });
react('minIsi', 50, { tarifCetakMinIsi: 100000 });
react('drekIsi', 500, { tarifDrekIsi: 50 });
react('royalty', 50, { tarifRoyalti: 100 });
react('steples', 50, { tarifSteplesPack: 4000 });
react('umr', 50, { umr: 3200000 });
react('sisir', 50, { tarifSisirPerPcs: 180 });
react('bending', 100, { tarifBending: 80 }, 'hpp', { finishing: 'Lem Bending,' }, 120);
react('minBending', 100, { minBending: 150000 }, 'hpp', { finishing: 'UV Varnish + Bending,' }, 120); // BZ masuk CJ, bukan BX mentah
react('glossy', 100, { tarifLaminasiGlossy: 0.5 });
react('doff', 100, { tarifLaminasiDoff: 0.6 }, 'hpp', { finishing: 'Laminasi Doff,' });
react('uv', 500, { tarifUvVarnish: 0.2 }, 'hpp', { finishing: 'UV Varnish,' }); // @500: mentah > floor
react('minFin', 20, { minFinishing: 60000 });
{
  const a30 = base(50);
  const b40 = calculateBukuSoftCoverHpp(
    { oplah: 50, varian: '21 x 29,7 cm', jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'Laminasi Glossy,', marginPct: 40 }, { ...D });
  check('reaktif margin Δjual>0', b40.hargaJualPerPcs - a30.hargaJualPerPcs > 0 ? 1 : 0, 1);
}
{
  const a = base(100);
  const mk = (o: any) => calculateBukuSoftCoverHpp(
    { oplah: 100, varian: '21 x 29,7 cm', jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'Laminasi Glossy,', marginPct: 30, ...o }, { ...D });
  check('reaktif mukaCover ΔQ≠0', mk({ mukaCover: '2 Muka' }).kebutuhanCetakCover - a.kebutuhanCetakCover !== 0 ? 1 : 0, 1); // display-only (Q=RxN, Excel: tanpa efek HPP di domain PI)
  check('reaktif halaman Δ>0', base(100, 48).totalHpp - a.totalHpp > 0 ? 1 : 0, 1);
  check('reaktif finishing Δ>0', mk({ finishing: 'None,' }).totalHpp - a.totalHpp !== 0 ? 1 : 0, 1);
}

console.log(`\nTIERS: ${BUKU_SOFT_COVER_TIERS.length}, PERMUTASI: ${permCount} kombinasi x2 assert`);
console.log(`HASIL: ${pass} PASSED, ${fail} FAILED`);
if (fails.length) { console.log('CONTOH GAGAL:'); fails.forEach((x) => console.log('  ' + x)); }
if (fail > 0) process.exit(1);
console.log('AUDIT BUKU SOFT COVER: LULUS 100% (0 selisih)');
