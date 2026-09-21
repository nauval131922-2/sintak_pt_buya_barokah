// Benchmark Kop Surat: snapshot Excel tersimpan (40 tier) + matriks permutasi + reaktivitas.
// Acuan: Pricelist KOP SURAT 1/2/3/4 Warna.xlsm, sheet BUKU (nilai cache hasil Excel).
import { calculateKopSuratHpp, DEFAULT_KOP_SURAT_PARAMS, KopSuratMasterParams, KopSuratJenisKop, KopSuratJenisCetak } from '../src/lib/kop-surat-calculator';

type Snap = { h: number; am: number; an: number; aq: number; ar: number; as: number };
const EXP_W1: Snap[] = [
  { h: 1, am: 79292.558825, an: 79292.558825, aq: 103080.3264725, ar: 103080.3264725, as: 103090 },
  { h: 2, am: 135228.935075, an: 67614.4675375, aq: 175797.61559749997, ar: 87898.80779874999, as: 87900 },
  { h: 3, am: 191165.31132500002, an: 63721.770441666675, aq: 248514.9047225, ar: 82838.30157416667, as: 82840 },
  { h: 4, am: 247101.68757500002, an: 61775.421893750005, aq: 321232.1938475, ar: 80308.048461875, as: 80310 },
  { h: 5, am: 303038.063825, an: 60607.612765000005, aq: 393949.48297250003, ar: 78789.89659450001, as: 78790 },
  { h: 6, am: 358974.44007500005, an: 59829.07334583334, aq: 466666.7720975001, ar: 77777.79534958335, as: 77780 },
  { h: 7, am: 414910.816325, an: 59272.97376071429, aq: 539384.0612225, ar: 77054.86588892857, as: 77060 },
  { h: 8, am: 470847.192575, an: 58855.899071875, aq: 612101.3503475, ar: 76512.6687934375, as: 76520 },
  { h: 9, am: 526783.568825, an: 58531.50764722222, aq: 684818.6394725001, ar: 76090.9599413889, as: 76100 },
  { h: 10, am: 582719.9450749999, an: 58271.99450749999, aq: 757535.9285974998, ar: 75753.59285974999, as: 75760 },
];
const EXP_W2: Snap[] = [
  { h: 1, am: 105192.558825, an: 105192.558825, aq: 136750.3264725, ar: 136750.3264725, as: 136760 },
  { h: 2, am: 176128.935075, an: 88064.4675375, aq: 228967.61559749997, ar: 114483.80779874999, as: 114490 },
  { h: 3, am: 247065.31132500002, an: 82355.10377500001, aq: 321184.90472250007, ar: 107061.63490750002, as: 107070 },
  { h: 4, am: 318001.687575, an: 79500.42189375, aq: 413402.19384749996, ar: 103350.54846187499, as: 103360 },
  { h: 5, am: 388938.063825, an: 77787.612765, aq: 505619.4829725, ar: 101123.8965945, as: 101130 },
  { h: 6, am: 459874.44007500005, an: 76645.74001250001, aq: 597836.7720975002, ar: 99639.46201625002, as: 99640 },
  { h: 7, am: 530810.816325, an: 75830.11661785714, aq: 690054.0612224999, ar: 98579.15160321428, as: 98580 },
  { h: 8, am: 601747.192575, an: 75218.399071875, aq: 782271.3503475, ar: 97783.9187934375, as: 97790 },
  { h: 9, am: 672683.568825, an: 74742.61875833332, aq: 874488.6394724998, ar: 97165.40438583332, as: 97170 },
  { h: 10, am: 743619.9450749999, an: 74361.9945075, aq: 966705.9285975001, ar: 96670.59285975, as: 96680 },
];
const EXP_W3: Snap[] = [
  { h: 1, am: 132811.28635, an: 132811.28635, aq: 172654.672255, ar: 172654.672255, as: 172660 },
  { h: 2, am: 218747.6626, an: 109373.8313, aq: 284371.96138, ar: 142185.98069, as: 142190 },
  { h: 3, am: 304684.03885, an: 101561.34628333333, aq: 396089.250505, ar: 132029.75016833332, as: 132030 },
  { h: 4, am: 390620.4151, an: 97655.103775, aq: 507806.53962999996, ar: 126951.63490749999, as: 126960 },
  { h: 5, am: 476556.79135, an: 95311.35827, aq: 619523.828755, ar: 123904.765751, as: 123910 },
  { h: 6, am: 562493.1676, an: 93748.86126666667, aq: 731241.11788, ar: 121873.51964666667, as: 121880 },
  { h: 7, am: 648429.54385, an: 92632.79197857143, aq: 842958.407005, ar: 120422.62957214286, as: 120430 },
  { h: 8, am: 734365.9201, an: 91795.7400125, aq: 954675.6961299999, ar: 119334.46201624999, as: 119340 },
  { h: 9, am: 820302.29635, an: 91144.69959444444, aq: 1066392.985255, ar: 118488.10947277777, as: 118490 },
  { h: 10, am: 906238.6726, an: 90623.86726, aq: 1178110.2743799998, ar: 117811.02743799999, as: 117820 },
];
const EXP_W4: Snap[] = [
  { h: 1, am: 161030.013875, an: 161030.013875, aq: 209339.0180375, ar: 209339.0180375, as: 209340 },
  { h: 2, am: 261966.390125, an: 130983.1950625, aq: 340556.3071625, ar: 170278.15358125, as: 170280 },
  { h: 3, am: 362902.766375, an: 120967.58879166667, aq: 471773.5962875, ar: 157257.86542916668, as: 157260 },
  { h: 4, am: 463839.142625, an: 115959.78565625, aq: 602990.8854125, ar: 150747.721353125, as: 150750 },
  { h: 5, am: 564775.5188750001, an: 112955.10377500001, aq: 734208.1745375, ar: 146841.6349075, as: 146850 },
  { h: 6, am: 665711.895125, an: 110951.98252083334, aq: 865425.4636625, ar: 144237.57727708333, as: 144240 },
  { h: 7, am: 766648.271375, an: 109521.181625, aq: 996642.7527875, ar: 142377.5361125, as: 142380 },
  { h: 8, am: 867584.647625, an: 108448.080953125, aq: 1127860.0419125, ar: 140982.5052390625, as: 140990 },
  { h: 9, am: 968521.023875, an: 107613.44709722222, aq: 1259077.3310375, ar: 139897.4812263889, as: 139900 },
  { h: 10, am: 1069457.4001250002, an: 106945.74001250001, aq: 1390294.6201625, ar: 139029.46201625, as: 139030 },
];

const INSHET: Record<number, number> = { 1: 30, 2: 30, 3: 40, 4: 50 };
const P: KopSuratMasterParams = { ...DEFAULT_KOP_SURAT_PARAMS };
const EPS = 1e-6;
const close = (a: number, b: number) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(b));

let pass = 0, fail = 0;
function check(label: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`[PASS] ${label}`); }
  else { fail++; console.log(`[FAIL] ${label} ${detail}`); }
}

console.log('=== A. Snapshot Excel tersimpan (FOLIO, 1 Muka, CETAK, TANPA SISIR, margin 30) ===');
for (const [w, exp] of [[1, EXP_W1], [2, EXP_W2], [3, EXP_W3], [4, EXP_W4]] as [number, Snap[]][]) {
  for (const s of exp) {
    const r = calculateKopSuratHpp({ oplahRim: s.h, jenisKop: 'FOLIO', nWarna: w as 1 | 2 | 3 | 4, muka: 1, jenisCetak: 'CETAK', finishingSisir: false, insheetLembar: INSHET[w], marginPct: 30 }, P);
    const ok = close(r.totalHpp, s.am) && close(r.hppPerRim, s.an) && close(r.totalHarga, s.aq) && close(r.hargaPerRim, s.ar) && r.hargaFinalPerRim === s.as;
    check(`${w} Warna rim=${s.h} HPP=${r.totalHpp} Final=${r.hargaFinalPerRim}`,
      ok, `exp AM=${s.am} AN=${s.an} AQ=${s.aq} AR=${s.ar} AS=${s.as} | got AM=${r.totalHpp} AN=${r.hppPerRim} AQ=${r.totalHarga} AR=${r.hargaPerRim} AS=${r.hargaFinalPerRim}`);
  }
}

// Transkripsi independen rumus BUKU (tanpa memakai calculateKopSuratHpp)
function expected(jenisKop: KopSuratJenisKop, w: number, muka: number, jenisCetak: KopSuratJenisCetak, sisir: boolean, insheet: number, H: number, margin: number) {
  const dims: Record<string, { t: number; u: number; o: number }> = {
    'FOLIO': { t: 21.5, u: 33, o: 1 },
    'A4': { t: 21, u: 29.7, o: 1 },
    'Setengah Folio': { t: 21.5, u: 33, o: 2 },
    'Setengah A4': { t: 21, u: 29.7, o: 2 },
  };
  const D = dims[jenisKop];
  const q = ((H * 500) / D.o) + insheet;
  const p = q; // N7=1
  const u29 = ((D.t * D.u) * 70) / 20000 * ((15700 * 0.05) + 15700);
  const r = (u29 / 500) * q;
  const x = w * muka;
  const plate = (jenisCetak === 'CETAK' ? 10000 : 0) * x;
  const ab = x * 15000;
  const ac = p - 500 === 0 ? 0 : (p - 500 >= 1 ? p - 500 : 0);
  const ad = ac === 0 ? 0 : ac * 30 * x;
  // U7 (Film) ≡ 0: T30 kosong + AM7 tak mencakup U7 (sesuai Excel)
  const sisirC = sisir ? ((((D.t * D.u) * 70) / 20000) / 500) * q * 1000 : 0;
  const am = r + 10000 + plate + ab + ad + sisirC;
  const an = am / H;
  const aq = (an + an * (margin / 100)) * H;
  return { am, as: Math.ceil((aq / H) / 10) * 10 };
}

console.log('=== B. Matriks permutasi (4 kop × 4 warna × 2 muka × 2 cetak × 2 sisir × 10 rim) ===');
const JENIS: KopSuratJenisKop[] = ['FOLIO', 'A4', 'Setengah Folio', 'Setengah A4'];
let permPass = 0, permFail = 0;
for (const jk of JENIS) for (let w = 1; w <= 4; w++) for (const muka of [1, 2]) for (const jc of ['CETAK', 'ONGKOS CETAK'] as KopSuratJenisCetak[]) for (const sisir of [false, true]) for (let h = 1; h <= 10; h++) {
  const r = calculateKopSuratHpp({ oplahRim: h, jenisKop: jk, nWarna: w as 1 | 2 | 3 | 4, muka: muka as 1 | 2, jenisCetak: jc, finishingSisir: sisir, insheetLembar: INSHET[w], marginPct: 30 }, P);
  const e = expected(jk, w, muka, jc, sisir, INSHET[w], h, 30);
  if (close(r.totalHpp, e.am) && r.hargaFinalPerRim === e.as) permPass++;
  else { permFail++; console.log(`[FAIL] permutasi ${jk}/${w}W/m${muka}/${jc}/${sisir ? 'S' : 'TS'}/rim${h}: got ${r.totalHpp}/${r.hargaFinalPerRim} exp ${e.am}/${e.as}`); }
}
console.log(`Permutasi: ${permPass} PASSED, ${permFail} FAILED (0 selisih)`);
if (permFail === 0) pass++; else fail++;

console.log('=== C. Reaktivitas parameter (Delta HPP > 0) ===');
const base = { oplahRim: 2, jenisKop: 'FOLIO' as KopSuratJenisKop, nWarna: 2 as const, muka: 1 as const, jenisCetak: 'CETAK' as KopSuratJenisCetak, finishingSisir: false, insheetLembar: 30, marginPct: 30 };
const hpp = (p: KopSuratMasterParams) => calculateKopSuratHpp(base, p).totalHpp;
const baseHpp = hpp(P);
const tests: [string, KopSuratMasterParams][] = [
  ['Gramatur 70→100', { ...P, gramatur: 100 }],
  ['Harga/kg 15700→20000', { ...P, hargaPerKg: 20000 }],
  ['Up 5%→10%', { ...P, upPct: 10 }],
  ['Insheet input 30→60', { ...P }],
  ['Desain 10000→50000', { ...P, desain: 50000 }],
  ['Royalty 0→1000/rim', { ...P, royaltyPerRim: 1000 }],
  ['Transport 0→5000', { ...P, transportPerOrder: 5000 }],
  ['Plat override 0→9', { ...P, platOverride: 9 }],
];
for (const [label, mp] of tests) {
  let got: number;
  if (label.startsWith('Insheet')) got = calculateKopSuratHpp({ ...base, insheetLembar: 60 }, P).totalHpp;
  else got = hpp(mp);
  check(`Reaktivitas: ${label} | ${baseHpp} -> ${got}`, got - baseHpp > 0, `delta=${got - baseHpp}`);
}
// Opsi input reaktif
const w3 = calculateKopSuratHpp({ ...base, nWarna: 3, insheetLembar: 40 }, P).totalHpp;
check(`Reaktivitas: 2 Warna→3 Warna | ${baseHpp} -> ${w3}`, w3 - baseHpp > 0, `delta=${w3 - baseHpp}`);
const s = calculateKopSuratHpp({ ...base, finishingSisir: true }, P).totalHpp;
check(`Reaktivitas: TANPA SISIR→SISIR | ${baseHpp} -> ${s}`, s - baseHpp > 0, `delta=${s - baseHpp}`);
const oc = calculateKopSuratHpp({ ...base, jenisCetak: 'ONGKOS CETAK' }, P).totalHpp;
check(`Reaktivitas: CETAK→ONGKOS CETAK | ${baseHpp} -> ${oc}`, oc - baseHpp !== 0, `delta=${oc - baseHpp}`);
const m2 = calculateKopSuratHpp({ ...base, muka: 2 }, P).totalHpp;
check(`Reaktivitas: 1 Muka→2 Muka | ${baseHpp} -> ${m2}`, m2 - baseHpp > 0, `delta=${m2 - baseHpp}`);

console.log('========================================================================================');
console.log(`HASIL AKHIR BENCHMARK: ${pass} LULUS, ${fail} GAGAL`);
console.log('========================================================================================');
process.exit(fail > 0 ? 1 : 0);
