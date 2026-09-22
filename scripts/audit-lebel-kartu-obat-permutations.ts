// Benchmark parity Lebel Kartu Obat vs cache Excel (BUKU!H7:H16, AR7:AR16 + komponen).
// Expected: scripts/lko-expected.json (hasil cache formula Excel, BUKAN hitungan SINTAK).
import { readFileSync } from 'fs';
import {
  calculateLebelKartuObatHpp,
  DEFAULT_LEBEL_KARTU_OBAT_PARAMS,
  LEBEL_KARTU_OBAT_TIERS,
  LebelKartuObatVarianType,
  LebelKartuObatJenisCetakType,
  LebelKartuObatMukaType,
  LebelKartuObatWarnaType,
  LebelKartuObatFinishingType,
} from '../src/lib/lebel-kartu-obat-calculator';

const EXPECTED: Record<string, any[]> = JSON.parse(readFileSync('scripts/lko-expected.json', 'utf8'));
const VARIANTS = Object.keys(EXPECTED) as LebelKartuObatVarianType[];
const D = DEFAULT_LEBEL_KARTU_OBAT_PARAMS;

const COMP: Record<string, string> = {
  'Kertas HVS 70 gsm Folio': 'R', Desain: 'T', 'Plate Cetak': 'W',
  Royalty: 'AG', Transport: 'AI', Sisir: 'AJ',
};

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, a: number, b: number) => {
  if (a === b) pass++;
  else { fail++; if (fails.length < 20) fails.push(`${label}: sintak=${a} excel=${b} selisih=${a - b}`); }
};

// ---------- 1. PARITY saved-state (CETAK/1 Muka/1 Warna/SISIR, margin 30) vs cache Excel ----------
for (const v of VARIANTS) {
  for (const t of EXPECTED[v]) {
    const r = calculateLebelKartuObatHpp(
      { oplah: t.H, varian: v, jenisCetak: 'CETAK', muka: '1 Muka', warna: '1 Warna', finishing: 'SISIR', marginPct: 30 }, { ...D });
    check(`${v}@${t.H} Q`, r.kebutuhanPlano, t.Q);
    check(`${v}@${t.H} P`, r.kebutuhanCetak, t.P);
    for (const item of r.breakdown) {
      const key = item.nama.startsWith('Cetak') ? 'Cetak' : item.nama;
      if (key === 'Cetak') { check(`${v}@${t.H} AE`, Math.round(t.AE) === undefined ? -1 : item.nominal, Math.round(t.AE)); continue; }
      const exp = t[COMP[key]];
      if (exp !== null && exp !== undefined) check(`${v}@${t.H} ${item.nama}`, item.nominal, Math.round(exp));
    }
    check(`${v}@${t.H} AL`, r.totalHpp, Math.round(t.AL));
    check(`${v}@${t.H} AR`, r.hargaJualPerRim, t.AR);
  }
}

// ---------- 2. ORACLE independen untuk seluruh permutasi ----------
function oracle(o: {
  H: number; jenis: LebelKartuObatJenisCetakType; muka: LebelKartuObatMukaType;
  warna: LebelKartuObatWarnaType; fin: LebelKartuObatFinishingType; margin: number; p: typeof D;
}) {
  const M = o.muka === '1 Muka' ? 1 : 2;
  const L = Number(o.warna[0]);
  const OO = o.jenis === 'ONGKOS CETAK';
  const K = o.H > 0 ? o.p.insheetLbr : 0;
  const Q = o.H > 0 ? ((o.H * 500) / 1) + (K / 1) : 0;
  const P = 1 * Q;
  const rim = ((21.5 * 33) * o.p.gramaturGsm) / 20000 * (o.p.tarifKertasKg * (1 + o.p.upKertasPct / 100));
  const R = (rim / 500) * Q;
  const T = o.H > 0 ? o.p.tarifDesain : 0;
  const X = L * M;
  const W = o.H > 0 ? (OO ? 0 : o.p.tarifPlatePerPlat) * X : 0;
  const AB = X * (o.H > 0 ? o.p.tarifCetakMinPerPlat : 0);
  const AC = P - 500 === 0 ? 0 : P - 500 >= 1 ? P - 500 : 0;
  const AD = AC === 0 ? 0 : AC >= 1 ? AC * o.p.tarifDrekPerWarna * X : 0;
  const AE = AD + AB;
  const AG = o.H * o.p.tarifRoyaltyPerPcs;
  const AJ = o.fin === 'SISIR' ? (Q / 500) * o.p.tarifSisirPer500 : 0;
  const AL = R + T + W + AE + AG + o.p.biayaTransport + AJ;
  const AM = o.H > 0 ? AL / o.H : 0;
  const AR = o.H > 0 ? Math.ceil((AM * (1 + o.margin / 100)) / 10) * 10 : 0;
  return { AL: Math.round(AL), AR, Q, P };
}

const JENIS: LebelKartuObatJenisCetakType[] = ['CETAK', 'ONGKOS CETAK'];
const MUKAS: LebelKartuObatMukaType[] = ['1 Muka', '2 Muka'];
const WARNAS: LebelKartuObatWarnaType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
const FINS: LebelKartuObatFinishingType[] = ['SISIR', 'TANPA SISIR'];
let permCount = 0;
for (const v of VARIANTS) {
  for (const H of [1, 2, 5, 10]) {
    for (const jenis of JENIS)
      for (const muka of MUKAS)
        for (const warna of WARNAS)
          for (const fin of FINS) {
            permCount++;
            const p = { ...D };
            const r = calculateLebelKartuObatHpp({ oplah: H, varian: v, jenisCetak: jenis, muka, warna, finishing: fin, marginPct: 30 }, p);
            const e = oracle({ H, jenis, muka, warna, fin, margin: 30, p });
            check(`perm ${v}@${H} ${jenis}/${muka}/${warna}/${fin} AL`, r.totalHpp, e.AL);
            check(`perm ${v}@${H} ${jenis}/${muka}/${warna}/${fin} AR`, r.hargaJualPerRim, e.AR);
          }
  }
}

// ---------- 3. REAKTIVITAS ----------
const base = (v: LebelKartuObatVarianType, H: number, extra: any = {}) => calculateLebelKartuObatHpp(
  { oplah: H, varian: v, jenisCetak: 'CETAK', muka: '1 Muka', warna: '1 Warna', finishing: 'SISIR', marginPct: 30, ...extra }, { ...D });
const react = (label: string, v: LebelKartuObatVarianType, H: number, patch: Partial<typeof D>, target: 'hpp' | 'jual' = 'hpp', extra: any = {}) => {
  const a = base(v, H);
  const b = calculateLebelKartuObatHpp(
    { oplah: H, varian: v, jenisCetak: 'CETAK', muka: '1 Muka', warna: '1 Warna', finishing: 'SISIR', marginPct: 30, ...extra },
    { ...D, ...patch });
  const d = target === 'hpp' ? b.totalHpp - a.totalHpp : b.hargaJualPerRim - a.hargaJualPerRim;
  check(`reaktif ${label} Δ>0`, d > 0 ? 1 : 0, 1);
};
const V1: LebelKartuObatVarianType = '3,5 x 7 cm';
react('kertasKg', V1, 2, { tarifKertasKg: 18000 });
react('up', V1, 2, { upKertasPct: 10 });
react('gramatur', V1, 2, { gramaturGsm: 80 });
react('insheet', V1, 2, { insheetLbr: 60 });
react('desain', V1, 2, { tarifDesain: 15000 });
react('plate', V1, 2, { tarifPlatePerPlat: 12000 });
react('minCetak', V1, 2, { tarifCetakMinPerPlat: 20000 });
react('drek', V1, 2, { tarifDrekPerWarna: 40 });
react('royalty', V1, 2, { tarifRoyaltyPerPcs: 100 });
react('transport', V1, 2, { biayaTransport: 5000 });
react('sisir', V1, 2, { tarifSisirPer500: 15000 });
react('margin', V1, 2, {}, 'jual', { marginPct: 40 });
{
  const a = base(V1, 3);
  const mk = (o: any) => calculateLebelKartuObatHpp(
    { oplah: 3, varian: V1, jenisCetak: 'CETAK', muka: '1 Muka', warna: '1 Warna', finishing: 'SISIR', marginPct: 30, ...o }, { ...D });
  check('reaktif jenis Δ>0', a.totalHpp - mk({ jenisCetak: 'ONGKOS CETAK' }).totalHpp > 0 ? 1 : 0, 1);
  check('reaktif muka Δ>0', mk({ muka: '2 Muka' }).totalHpp - a.totalHpp > 0 ? 1 : 0, 1);
  check('reaktif warna Δ>0', mk({ warna: '2 Warna' }).totalHpp - a.totalHpp > 0 ? 1 : 0, 1);
  check('reaktif sisir Δ>0', a.totalHpp - mk({ finishing: 'TANPA SISIR' }).totalHpp > 0 ? 1 : 0, 1);
}

console.log(`\nTIERS: ${LEBEL_KARTU_OBAT_TIERS.length}, PERMUTASI: ${permCount} kombinasi x2 assert`);
console.log(`HASIL: ${pass} PASSED, ${fail} FAILED`);
if (fails.length) { console.log('CONTOH GAGAL:'); fails.forEach((x) => console.log('  ' + x)); }
if (fail > 0) process.exit(1);
console.log('AUDIT LEBEL KARTU OBAT: LULUS 100% (0 selisih)');
