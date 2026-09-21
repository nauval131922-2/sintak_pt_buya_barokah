// Benchmark Undangan: snapshot Excel tersimpan (30 tier) + matriks permutasi + reaktivitas.
// Acuan: 4 file Harga UNDANGAN {15 x 17, 15,5 x 15,5} × {Oliver, Print Inter}, sheet BUKU.
import { calculateUndanganHpp, DEFAULT_UNDANGAN_PARAMS, UndanganMasterParams, UndanganUkuran, UndanganMesin, UndanganFinishing } from '../src/lib/undangan-calculator';

type Snap = { h: number; bm: number; bn: number; bq: number; br: number; bs: number };
const EXP_15x17_Oliver: Snap[] = [
  { h: 1000, bm: 1680538.6166966015, bn: 1680.5386166966016, bq: 2184700.201705582, br: 2184.700201705582, bs: 2190 },
  { h: 1500, bm: 1948854.180834902, bn: 1299.2361205566012, bq: 2533510.4350853725, br: 1689.0069567235817, bs: 1690 },
  { h: 2000, bm: 2222289.7449732027, bn: 1111.1448724866013, bq: 2888976.6684651636, br: 1444.4883342325818, bs: 1450 },
  { h: 2500, bm: 2491034.8364515034, bn: 996.4139345806013, bq: 3238345.2873869543, br: 1295.3381149547818, bs: 1300 },
  { h: 3000, bm: 2764470.4005898037, bn: 921.4901335299346, bq: 3593811.520766745, br: 1197.937173588915, bs: 1200 },
];
const EXP_15x17_Print: Snap[] = [
  { h: 50, bm: 187000, bn: 3740, bq: 243100, br: 4862, bs: 4870 },
  { h: 100, bm: 305500, bn: 3055, bq: 397150, br: 3971.5, bs: 3980 },
  { h: 150, bm: 424000, bn: 2826.6666666666665, bq: 551200, br: 3674.6666666666665, bs: 3680 },
  { h: 200, bm: 542500, bn: 2712.5, bq: 705250, br: 3526.25, bs: 3530 },
  { h: 250, bm: 661000, bn: 2644, bq: 859300, br: 3437.2, bs: 3440 },
  { h: 300, bm: 779500, bn: 2598.3333333333335, bq: 1013350, br: 3377.8333333333335, bs: 3380 },
  { h: 350, bm: 898000, bn: 2565.714285714286, bq: 1167400, br: 3335.4285714285716, bs: 3340 },
  { h: 400, bm: 1016500, bn: 2541.25, bq: 1321450, br: 3303.625, bs: 3310 },
  { h: 500, bm: 1253500, bn: 2507, bq: 1629550, br: 3259.1, bs: 3260 },
  { h: 600, bm: 1491900, bn: 2486.5, bq: 1939470, br: 3232.45, bs: 3240 },
];
const EXP_155_Oliver: Snap[] = [
  { h: 1000, bm: 1680538.6166966015, bn: 1680.5386166966016, bq: 2184700.201705582, br: 2184.700201705582, bs: 2190 },
  { h: 1500, bm: 1948854.180834902, bn: 1299.2361205566012, bq: 2533510.4350853725, br: 1689.0069567235817, bs: 1690 },
  { h: 2000, bm: 2222289.7449732027, bn: 1111.1448724866013, bq: 2888976.6684651636, br: 1444.4883342325818, bs: 1450 },
  { h: 2500, bm: 2491034.8364515034, bn: 996.4139345806013, bq: 3238345.2873869543, br: 1295.3381149547818, bs: 1300 },
  { h: 3000, bm: 2764470.4005898037, bn: 921.4901335299346, bq: 3593811.520766745, br: 1197.937173588915, bs: 1200 },
];
const EXP_155_Print: Snap[] = [
  { h: 50, bm: 151000, bn: 3020, bq: 196300, br: 3926, bs: 3930 },
  { h: 100, bm: 233500, bn: 2335, bq: 303550, br: 3035.5, bs: 3040 },
  { h: 150, bm: 311500, bn: 2076.6666666666665, bq: 404950, br: 2699.6666666666665, bs: 2700 },
  { h: 200, bm: 394000, bn: 1970, bq: 512200, br: 2561, bs: 2570 },
  { h: 250, bm: 476500, bn: 1906, bq: 619450, br: 2477.8, bs: 2480 },
  { h: 300, bm: 554500, bn: 1848.3333333333333, bq: 720849.9999999999, br: 2402.833333333333, bs: 2410 },
  { h: 350, bm: 637000, bn: 1820, bq: 828100, br: 2366, bs: 2370 },
  { h: 400, bm: 719500, bn: 1798.75, bq: 935350, br: 2338.375, bs: 2340 },
  { h: 500, bm: 880000, bn: 1760, bq: 1144000, br: 2288, bs: 2290 },
  { h: 600, bm: 1041900, bn: 1736.5, bq: 1354470, br: 2257.45, bs: 2260 },
];

const P: UndanganMasterParams = { ...DEFAULT_UNDANGAN_PARAMS };
const EPS = 1e-6;
const close = (a: number, b: number) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(b));

let pass = 0, fail = 0;
function check(label: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`[PASS] ${label}`); }
  else { fail++; console.log(`[FAIL] ${label} ${detail}`); }
}

// Spesifikasi tiap file tersimpan (D14=2 Muka, D15=4 Warna, D20=None, AT/AN/AO=X, BK28 ikut mesin)
const FILE_SPECS: { tag: string; ukuran: UndanganUkuran; mesin: UndanganMesin; insheet: number; kardus: boolean; exp: Snap[] }[] = [
  { tag: '15x17 Oliver', ukuran: '15 x 17', mesin: 'Oliver', insheet: 150, kardus: true, exp: EXP_15x17_Oliver },
  { tag: '15x17 Print', ukuran: '15 x 17', mesin: 'Print Inter', insheet: 7, kardus: false, exp: EXP_15x17_Print },
  { tag: '15,5 Oliver', ukuran: '15,5 x 15,5', mesin: 'Oliver', insheet: 150, kardus: true, exp: EXP_155_Oliver },
  { tag: '15,5 Print', ukuran: '15,5 x 15,5', mesin: 'Print Inter', insheet: 7, kardus: false, exp: EXP_155_Print },
];

console.log('=== A. Snapshot Excel tersimpan (30 tier) ===');
for (const fs of FILE_SPECS) {
  for (const s of fs.exp) {
    const r = calculateUndanganHpp({ oplahPcs: s.h, ukuran: fs.ukuran, nWarna: 4, muka: 2, mesin: fs.mesin, finishing: 'None,', labelAktif: false, lipatAktif: false, pasangPlastikAktif: false, kardusAktif: fs.kardus, insheetLembar: fs.insheet, marginPct: 30 }, P);
    const ok = close(r.totalHpp, s.bm) && close(r.hppPerPcs, s.bn) && close(r.totalHarga, s.bq) && close(r.hargaPerPcs, s.br) && r.hargaFinalPerPcs === s.bs;
    check(`${fs.tag} pcs=${s.h} HPP=${r.totalHpp} Final=${r.hargaFinalPerPcs}`,
      ok, `exp BM=${s.bm} BN=${s.bn} BQ=${s.bq} BR=${s.br} BS=${s.bs} | got BM=${r.totalHpp} BN=${r.hppPerPcs} BQ=${r.totalHarga} BR=${r.hargaPerPcs} BS=${r.hargaFinalPerPcs}`);
  }
}

// Transkripsi independen rumus BUKU
const MESIN_SPEC: Record<string, { o: number; p: number; v: number; w: number }> = {
  'Oliver': { o: 4, p: 12, v: 79, w: 109 },
  'Print Inter': { o: 1, p: 2, v: 32.5, w: 48 },
};
function expected(ukuran: UndanganUkuran, w: number, muka: number, mesin: UndanganMesin, fin: UndanganFinishing, label: boolean, lipat: boolean, pasang: boolean, kardus: boolean, insheet: number, H: number, margin: number) {
  const M = { ...MESIN_SPEC[mesin] };
  if (ukuran === '15,5 x 15,5' && mesin === 'Print Inter') M.p = 3; // BUKU!P7 cabang 15,5+Print
  const dd = ukuran === '15 x 17' ? { d: 17, f: 30 } : { d: 15.5, f: 31 };
  const isOl = mesin === 'Oliver';
  const up = isOl ? 5 : 0;
  const r = Math.ceil(H / M.p + insheet / M.o);
  const q = r * M.o * muka;
  const w29 = ((M.v * M.w) * 230) / 20000 * ((16400 * (up / 100)) + 16400);
  const t = isOl ? (w29 / 500) * r : r * 4500;
  const z = w * muka;
  const ad = (isOl ? 90000 : 0) * z;
  const ae = isOl && q - 1000 > 1 ? q - 1000 : 0;
  const af = ae === 0 ? 0 : ae * 40 * w;
  const am = (H / 100) * 12000;
  const an = lipat ? ((2815858 / 25) / 5000) * H : 0;
  const ao = pasang ? ((2815858 / 25) / 500) * H : 0;
  const at = label ? Math.ceil(H / 84) * 5000 + Math.ceil(H / 12) * 1500 : 0;
  const sisir = (H / 500) * 7000 < 7000 ? 7000 : (H / 500) * 7000;
  const lam = (dd.d + 1) * (dd.f + 1) * H * muka;
  const az = fin === 'Laminasi Glossy,' ? (lam * 0.35 === 0 ? 0 : lam * 0.35 > 50000 ? lam * 0.35 : 50000) : 0;
  const bc = fin === 'Laminasi Doff,' ? (lam * 0.4 === 0 ? 0 : lam * 0.4 > 50000 ? lam * 0.4 : 50000) : 0;
  const bf = fin === 'UV Varnish,' ? (lam * 0.12 === 0 ? 0 : lam * 0.12 > 50000 ? lam * 0.12 : 50000) : 0;
  const bk = kardus ? Math.ceil(H / 500) * 9200 + 9200 * ((H / 500) / (7650 / 196)) : 0;
  const bm = t + 20000 + (isOl ? 45000 : 0) * z + (af + ad) + 0 + (isOl ? 15000 : 10000) + (am + an + ao) + sisir + az + bc + bf + 0 + bk + at;
  const bn = bm / H;
  const bq = (bn + bn * (margin / 100)) * H;
  return { bm, bs: Math.ceil((bq / H) / 10) * 10 };
}

console.log('=== B. Matriks permutasi (2 ukuran × 4 warna × 2 muka × 2 mesin × 4 finishing × 2 label × 2 lipat × 2 pasang × 2 kardus × 15 tier) ===');
const TIERS = [50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 1000, 1500, 2000, 2500, 3000];
const FINS: UndanganFinishing[] = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,'];
let permPass = 0, permFail = 0;
for (const uk of ['15 x 17', '15,5 x 15,5'] as UndanganUkuran[])
  for (let w = 1; w <= 4; w++)
    for (const mu of [1, 2])
      for (const mc of ['Oliver', 'Print Inter'] as UndanganMesin[])
        for (const fn of FINS)
          for (const lb of [false, true])
            for (const li of [false, true])
              for (const ps of [false, true])
                for (const kd of [false, true]) {
                  const insheet = mc === 'Oliver' ? 150 : 7;
                  for (const h of TIERS) {
                    const r = calculateUndanganHpp({ oplahPcs: h, ukuran: uk, nWarna: w as 1 | 2 | 3 | 4, muka: mu as 1 | 2, mesin: mc, finishing: fn, labelAktif: lb, lipatAktif: li, pasangPlastikAktif: ps, kardusAktif: kd, insheetLembar: insheet, marginPct: 30 }, P);
                    const e = expected(uk, w, mu, mc, fn, lb, li, ps, kd, insheet, h, 30);
                    if (close(r.totalHpp, e.bm) && r.hargaFinalPerPcs === e.bs) permPass++;
                    else { permFail++; if (permFail <= 10) console.log(`[FAIL] ${uk}/${w}W/m${mu}/${mc}/${fn}/${lb ? 'L' : '-'}/${li ? 'Li' : '-'}/${ps ? 'P' : '-'}/${kd ? 'K' : '-'}/pcs${h}: got ${r.totalHpp}/${r.hargaFinalPerPcs} exp ${e.bm}/${e.bs}`); }
                  }
                }
console.log(`Permutasi: ${permPass} PASSED, ${permFail} FAILED (0 selisih)`);
if (permFail === 0) pass++; else fail++;

console.log('=== C. Reaktivitas parameter (Delta HPP > 0) ===');
const base = { oplahPcs: 1000, ukuran: '15 x 17' as UndanganUkuran, nWarna: 4 as const, muka: 2 as const, mesin: 'Oliver' as UndanganMesin, finishing: 'None,' as UndanganFinishing, labelAktif: false, lipatAktif: false, pasangPlastikAktif: false, kardusAktif: true, insheetLembar: 150, marginPct: 30 };
const hpp = (p: UndanganMasterParams) => calculateUndanganHpp(base, p).totalHpp;
const baseHpp = hpp(P);
const tests: [string, UndanganMasterParams][] = [
  ['HargaKg 16400→20000', { ...P, hargaPerKg: 20000 }],
  ['UpOffset 5→10', { ...P, upOffsetPct: 10 }],
  ['Gramatur 230→310', { ...P }],
  ['Desain 20000→50000', { ...P, desain: 50000 }],
  ['Royalty 0→500/pcs', { ...P, royaltyPerPcs: 500 }],
  ['TransportOliver 15000→30000', { ...P, transportOliver: 30000 }],
  ['PlastikOpp 12000→20000', { ...P, tarifPlastikOpp: 20000 }],
  ['Label 5000→8000', { ...P, tarifLabel: 8000 }],
  ['PrintLabel 1500→3000', { ...P, tarifPrintLabel: 3000 }],
  ['SisirBase 7000→10000', { ...P, tarifSisirBase: 10000 }],
  ['Kardus 9200→15000', { ...P, tarifKardusBox: 15000 }],
  ['Lakban 9200→15000', { ...P, tarifLakbanRoll: 15000 }],
  ['PrintA3 4500→6000', { ...P, tarifPrintA3: 6000 }],
];
for (const [label, mp] of tests) {
  let got: number;
  if (label.startsWith('Gramatur')) got = calculateUndanganHpp({ ...base, }, { ...P, gramatur: 310 }).totalHpp;
  else if (label.startsWith('PrintA3')) got = calculateUndanganHpp({ ...base, mesin: 'Print Inter', insheetLembar: 7, kardusAktif: false }, mp).totalHpp;
  else if (label.startsWith('Label') || label.startsWith('PrintLabel')) got = calculateUndanganHpp({ ...base, labelAktif: true }, mp).totalHpp;
  else got = hpp(mp);
  check(`Reaktivitas: ${label} | ${baseHpp} -> ${got}`, got - baseHpp > 0, `delta=${got - baseHpp}`);
}
const lam = calculateUndanganHpp({ ...base, finishing: 'Laminasi Glossy,' }, P).totalHpp;
check(`Reaktivitas: None→Laminasi Glossy | ${baseHpp} -> ${lam}`, lam - baseHpp > 0, `delta=${lam - baseHpp}`);
const lb = calculateUndanganHpp({ ...base, labelAktif: true }, P).totalHpp;
check(`Reaktivitas: Label X→√ | ${baseHpp} -> ${lb}`, lb - baseHpp > 0, `delta=${lb - baseHpp}`);
const li = calculateUndanganHpp({ ...base, lipatAktif: true }, P).totalHpp;
check(`Reaktivitas: Lipat X→√ | ${baseHpp} -> ${li}`, li - baseHpp > 0, `delta=${li - baseHpp}`);
const kd = calculateUndanganHpp({ ...base, kardusAktif: false }, P).totalHpp;
check(`Reaktivitas: Kardus √→X | ${baseHpp} -> ${kd}`, baseHpp - kd > 0, `delta=${baseHpp - kd}`);
const w1 = calculateUndanganHpp({ ...base, nWarna: 1 }, P).totalHpp;
check(`Reaktivitas: 4 Warna→1 Warna | ${baseHpp} -> ${w1}`, baseHpp - w1 > 0, `delta=${baseHpp - w1}`);

console.log('========================================================================================');
console.log(`HASIL AKHIR BENCHMARK: ${pass} LULUS, ${fail} GAGAL`);
console.log('========================================================================================');
process.exit(fail > 0 ? 1 : 0);
