// Benchmark parity Kartu Koperasi Promise vs cache Excel (BUKU!H7:H21, BJ7:BJ21 + komponen).
// Expected: scripts/kop-expected.json (hasil cache formula Excel, BUKAN hitungan SINTAK).
import { readFileSync } from 'fs';
import {
  calculateKartuKoperasiPromiseHpp,
  DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS,
  KARTU_KOPERASI_PROMISE_CONFIG,
  KARTU_KOPERASI_PROMISE_TIERS,
  KartuKoperasiPromiseVarianType,
  KartuKoperasiPromiseMesinType,
  KartuKoperasiPromiseMukaType,
  KartuKoperasiPromiseWarnaType,
  KartuKoperasiPromiseFinishingType,
} from '../src/lib/kartu-koperasi-promise-calculator';

const EXPECTED: Record<string, any[]> = JSON.parse(readFileSync('scripts/kop-expected.json', 'utf8'));
const VARIANTS = Object.keys(EXPECTED) as KartuKoperasiPromiseVarianType[];
const D = DEFAULT_KARTU_KOPERASI_PROMISE_PARAMS;
// Param file per varian (Master!D11/E11/D16 bawaan file):
const FILE_P = {
  '10,5 x 16,5': { tarifKertasKg: 34800, upKertasPct: 5, tarifDesign: 15000 },
  '10,5 x 21,5': { tarifKertasKg: 34800, upKertasPct: 5, tarifDesign: 15000 },
  '12,7 x 16,3': { tarifKertasKg: 33000, upKertasPct: 0, tarifDesign: 0 },
} as const;

const COMP: Record<string, string> = {
  'Kertas BC 160 gsm': 'S', Desain: 'U', 'Plate Cetak': 'X', Cetak: 'AF',
  Royalty: 'AH', Transport: 'AJ', 'Biaya Lain-Lain': 'AK', 'Pisau Pound': 'AL',
  Pound: 'AM', Sisir: 'AN', 'Laminasi Glossy': 'AQ', 'Laminasi Doff': 'AT',
  'UV Varnish': 'AW', 'Packing Kardus & Lakban': 'BB',
};

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, a: number, b: number) => {
  if (a === b) pass++;
  else { fail++; if (fails.length < 20) fails.push(`${label}: sintak=${a} excel=${b} selisih=${a - b}`); }
};

// ---------- 1. PARITY saved-state (Ryobi/2 Muka/1 Warna/None, margin 30) vs cache Excel ----------
for (const v of VARIANTS) {
  for (const t of EXPECTED[v]) {
    const r = calculateKartuKoperasiPromiseHpp(
      { oplah: t.H, varian: v, mesin: 'Ryobi', muka: '2 Muka', warna: '1 Warna', finishing: 'None,', marginPct: 30 },
      { ...D, ...FILE_P[v] }
    );
    check(`${v}@${t.H} Q`, r.kebutuhanPlano, t.Q);
    check(`${v}@${t.H} P`, r.kebutuhanCetak, t.P);
    for (const item of r.breakdown) {
      const key = item.nama.startsWith('Cetak') ? 'Cetak' : item.nama;
      const exp = t[COMP[key]];
      if (exp !== null && exp !== undefined) check(`${v}@${t.H} ${item.nama}`, item.nominal, Math.round(exp));
    }
    check(`${v}@${t.H} BD`, r.totalHpp, Math.round(t.BD));
    check(`${v}@${t.H} BJ`, r.hargaJualPerPcs, t.BJ);
  }
}
// resolusi default per-varian: tanpa override eksplisit hasilnya harus identik
for (const v of VARIANTS) {
  const a = calculateKartuKoperasiPromiseHpp(
    { oplah: 1000, varian: v, mesin: 'Ryobi', muka: '2 Muka', warna: '1 Warna', finishing: 'None,', marginPct: 30 }, { ...D });
  const b = calculateKartuKoperasiPromiseHpp(
    { oplah: 1000, varian: v, mesin: 'Ryobi', muka: '2 Muka', warna: '1 Warna', finishing: 'None,', marginPct: 30 },
    { ...D, ...FILE_P[v] });
  check(`${v} file-default`, a.totalHpp, b.totalHpp);
}

// ---------- 2. ORACLE independen (replikasi polos rumus Excel) untuk seluruh permutasi ----------
function oracle(o: {
  H: number; v: KartuKoperasiPromiseVarianType; mesin: KartuKoperasiPromiseMesinType;
  muka: KartuKoperasiPromiseMukaType; warna: KartuKoperasiPromiseWarnaType;
  fin: KartuKoperasiPromiseFinishingType; margin: number; p: typeof D;
}) {
  const c = KARTU_KOPERASI_PROMISE_CONFIG[o.v];
  const M = o.muka === '1 Muka' ? 1 : 2;
  const Y = Number(o.warna[0]);
  const PI = o.mesin === 'Print Inter';
  const k2h = o.p.koefInsheet * o.H;
  const K = o.H > 0 && o.p.koefInsheet > 0 && k2h <= 40 ? 40
    : o.H > 0 && o.p.koefInsheet > 0 && k2h > 30 ? k2h
    : o.H > 0 && o.p.koefInsheet <= 0 ? o.p.insheet : 0;
  const N = PI ? c.potongPrintInter : c.potongRyobi;
  const O = PI ? c.kartuPrintInter : c.kartuRyobi;
  const Q = o.H > 0 ? Math.ceil(o.H / O + K / N) : 0;
  const P = Q * N * (c.includeMukaInCetak ? M : 1);
  const rim = ((c.planoW * c.planoH) * o.p.gramaturGsm) / 20000 * (o.p.tarifKertasKg * (1 + o.p.upKertasPct / 100));
  const S = o.H > 0 ? (PI ? o.p.tarifPrintA3Plus * Q : (rim / 500) * Q) : 0;
  const U = o.H > 0 ? o.p.tarifDesign : 0;
  const Yp = c.platOverride > 0 ? c.platOverride : Y * M;
  const X = o.H > 0 ? (PI ? 0 : o.p.tarifPlatePerPlat) * Yp : 0;
  const AC = o.H > 0 ? (PI ? 0 : o.p.tarifCetakMinPerPlat) * Yp : 0;
  const AD = !PI && P - 500 > 1 ? P - 500 : 0;
  const AE = (AD === 0 ? 0 : AD > 1 ? AD : 0) * (PI ? 0 : c.tarifDrek) * Y;
  const AF = AE + AC;
  const AH = o.H * o.p.tarifRoyaltyPerPcs;
  const AL = o.H > 0 ? o.p.tarifPisauPerCm2 * (c.pisauW * c.pisauH) : 0;
  const am6 = (o.p.umr / 25) / c.targetPound;
  const eff = o.H / (O / N);
  const rawAM = eff * am6;
  const AM = o.H > 0 && rawAM <= o.p.minPound ? o.p.minPound : o.H > 0 && rawAM > o.p.minPound ? rawAM : 0;
  const AN = (eff / 500) * o.p.tarifSisirPer500;
  const luas = (c.kartuW + 1) * (c.kartuH + 1);
  const gate = (raw: number, on: boolean) => (on ? (raw === 0 ? 0 : raw > o.p.minFinishing ? raw : o.p.minFinishing) : 0);
  const AQ = gate(luas * o.p.tarifLaminasiGlossy * o.H, o.fin === 'Laminasi Glossy,');
  const AT = gate(luas * o.p.tarifLaminasiDoff * o.H, o.fin === 'Laminasi Doff,');
  const AW = gate(luas * o.p.tarifUvVarnish * o.H, o.fin === 'UV Varnish,');
  const boxPerRoll = o.p.lakbanUkuranRoll / 196;
  const BA = o.p.tarifLakbanRoll * (o.H / o.p.kardusIsiPcs / boxPerRoll);
  const BB = (o.H > 0 ? Math.ceil(o.H / o.p.kardusIsiPcs) * o.p.tarifKardusBox : 0) + BA;
  const BD = S + U + X + AF + AH + o.p.biayaTransport + AN + AQ + AT + AW + o.p.biayaLain + BB + AM + AL;
  const BE = o.H > 0 ? BD / o.H : 0;
  const BJ = o.H > 0 ? Math.ceil((BE * (1 + o.margin / 100)) / 10) * 10 : 0;
  return { BD: Math.round(BD), BJ, Q, P };
}

const MESINS: KartuKoperasiPromiseMesinType[] = ['Print Inter', 'Ryobi'];
const MUKAS: KartuKoperasiPromiseMukaType[] = ['1 Muka', '2 Muka'];
const WARNAS: KartuKoperasiPromiseWarnaType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
const FINS: KartuKoperasiPromiseFinishingType[] = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,'];
let permCount = 0;
for (const v of VARIANTS) {
  for (const H of [500, 1500, 10000]) {
    for (const mesin of MESINS)
      for (const muka of MUKAS)
        for (const warna of WARNAS)
          for (const fin of FINS) {
            permCount++;
            const p = { ...D, ...FILE_P[v] };
            const r = calculateKartuKoperasiPromiseHpp({ oplah: H, varian: v, mesin, muka, warna, finishing: fin, marginPct: 30 }, p);
            const e = oracle({ H, v, mesin, muka, warna, fin, margin: 30, p });
            check(`perm ${v}@${H} ${mesin}/${muka}/${warna}/${fin} BD`, r.totalHpp, e.BD);
            check(`perm ${v}@${H} ${mesin}/${muka}/${warna}/${fin} BJ`, r.hargaJualPerPcs, e.BJ);
          }
  }
}

// ---------- 3. REAKTIVITAS (Delta HPP > 0, margin -> Delta Jual > 0) ----------
const base = (v: KartuKoperasiPromiseVarianType, H: number, extra = {}) => calculateKartuKoperasiPromiseHpp(
  { oplah: H, varian: v, mesin: 'Ryobi', muka: '2 Muka', warna: '1 Warna', finishing: 'None,', marginPct: 30, ...extra },
  { ...D, ...FILE_P[v] });
const react = (label: string, v: KartuKoperasiPromiseVarianType, H: number, patch: Partial<typeof D>, target: 'hpp' | 'jual' = 'hpp', extra: any = {}) => {
  const a = base(v, H);
  const b = calculateKartuKoperasiPromiseHpp(
    { oplah: H, varian: v, mesin: 'Ryobi', muka: '2 Muka', warna: '1 Warna', finishing: 'None,', marginPct: 30, ...extra },
    { ...D, ...FILE_P[v], ...patch });
  const d = target === 'hpp' ? b.totalHpp - a.totalHpp : b.hargaJualPerPcs - a.hargaJualPerPcs;
  check(`reaktif ${label} Δ>0`, d > 0 ? 1 : 0, 1);
};
const V105: KartuKoperasiPromiseVarianType = '10,5 x 16,5';
react('umr', V105, 10000, { umr: 9000000 });
react('kertasKg', V105, 500, { tarifKertasKg: 40000 });
react('up', V105, 500, { upKertasPct: 10 });
react('koefInsheet', V105, 2000, { koefInsheet: 0.05 });
react('insheet+koef0', V105, 500, { koefInsheet: 0, insheet: 200 });
react('gramatur', V105, 500, { gramaturGsm: 200 });
react('desain', V105, 500, { tarifDesign: 20000 });
react('printA3', V105, 500, { tarifPrintA3Plus: 3000 }, 'hpp', { mesin: 'Print Inter' as const });
react('plate', V105, 500, { tarifPlatePerPlat: 12000 });
react('minCetak', V105, 500, { tarifCetakMinPerPlat: 20000 });
react('royalty', V105, 500, { tarifRoyaltyPerPcs: 100 });
react('transport', V105, 500, { biayaTransport: 5000 });
react('lain', V105, 500, { biayaLain: 3000 });
react('pisau', V105, 500, { tarifPisauPerCm2: 200 });
react('sisir', V105, 500, { tarifSisirPer500: 15000 });
react('minPound', V105, 500, { minPound: 60000 });
react('glossy', V105, 1500, { tarifLaminasiGlossy: 0.5 }, 'hpp', { finishing: 'Laminasi Glossy,' as const });
react('doff', V105, 1500, { tarifLaminasiDoff: 0.6 }, 'hpp', { finishing: 'Laminasi Doff,' as const });
react('uv', V105, 1500, { tarifUvVarnish: 0.2 }, 'hpp', { finishing: 'UV Varnish,' as const });
react('minFin', V105, 500, { minFinishing: 60000 }, 'hpp', { finishing: 'Laminasi Glossy,' as const });
react('lakban', V105, 500, { tarifLakbanRoll: 10000 });
react('kardus', V105, 500, { tarifKardusBox: 10000 });
react('lakbanRoll', V105, 500, { lakbanUkuranRoll: 7000 }); // roll lebih kecil -> butuh roll lebih banyak
react('kardusIsi', V105, 5000, { kardusIsiPcs: 2000 });
react('margin', V105, 500, {}, 'jual', { marginPct: 40 }); // margin dari input, bukan params
// dropdown reaktif
{
  const a = base(V105, 1000);
  const b = calculateKartuKoperasiPromiseHpp(
    { oplah: 1000, varian: V105, mesin: 'Print Inter', muka: '2 Muka', warna: '1 Warna', finishing: 'None,', marginPct: 30 },
    { ...D, ...FILE_P[V105] });
  check('reaktif mesin PI Δ≠0', (b.totalHpp - a.totalHpp) !== 0 ? 1 : 0, 1);
  const c = calculateKartuKoperasiPromiseHpp(
    { oplah: 1000, varian: V105, mesin: 'Ryobi', muka: '2 Muka', warna: '2 Warna', finishing: 'None,', marginPct: 30 },
    { ...D, ...FILE_P[V105] });
  check('reaktif warna Δ>0', c.totalHpp - a.totalHpp > 0 ? 1 : 0, 1);
  const e2 = calculateKartuKoperasiPromiseHpp(
    { oplah: 1000, varian: V105, mesin: 'Ryobi', muka: '1 Muka', warna: '1 Warna', finishing: 'None,', marginPct: 30 },
    { ...D, ...FILE_P[V105] });
  check('reaktif muka Δ≠0', (e2.totalHpp - a.totalHpp) !== 0 ? 1 : 0, 1);
  const f = calculateKartuKoperasiPromiseHpp(
    { oplah: 1000, varian: V105, mesin: 'Ryobi', muka: '2 Muka', warna: '1 Warna', finishing: 'Laminasi Glossy,', marginPct: 30 },
    { ...D, ...FILE_P[V105] });
  check('reaktif finishing Δ>0', f.totalHpp - a.totalHpp > 0 ? 1 : 0, 1);
}

console.log(`\nTIERS: ${KARTU_KOPERASI_PROMISE_TIERS.length}, PERMUTASI: ${permCount} kombinasi x2 assert`);
console.log(`HASIL: ${pass} PASSED, ${fail} FAILED`);
if (fails.length) { console.log('CONTOH GAGAL:'); fails.forEach((x) => console.log('  ' + x)); }
if (fail > 0) process.exit(1);
console.log('AUDIT KARTU KOPERASI: LULUS 100% (0 selisih)');
