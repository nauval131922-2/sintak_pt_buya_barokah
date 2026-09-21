// Benchmark Sertifikat: snapshot Excel tersimpan (30 tier) + matriks permutasi + reaktivitas.
// Acuan: 6 file Pricelist Sertifikat 1 Muka {Ac 230, BC, Linen} × {Oliver, Print}, sheet BUKU.
import { calculateSertifikatHpp, DEFAULT_SERTIFIKAT_PARAMS, SertifikatMasterParams, SertifikatBahan, SertifikatMesin, SertifikatUkuran, SertifikatFinishing } from '../src/lib/sertifikat-calculator';

type Snap = { h: number; bi: number; bj: number; bm: number; bn: number; bo: number };
const EXP_Ac230_Oliver: Snap[] = [
  { h: 1000, bi: 987961.8948535948, bj: 987.9618948535948, bm: 1284350.4633096731, bn: 1284.3504633096732, bo: 1290 },
  { h: 1500, bi: 1172088.1156803921, bj: 781.3920771202614, bm: 1523714.5503845098, bn: 1015.8097002563399, bo: 1020 },
  { h: 2000, bi: 1363714.3365071896, bj: 681.8571682535948, bm: 1772828.6374593463, bn: 886.4143187296731, bo: 890 },
  { h: 2500, bi: 1587840.557333987, bj: 635.1362229335948, bm: 2064192.724534183, bn: 825.6770898136732, bo: 830 },
  { h: 3000, bi: 1803466.7781607844, bj: 601.1555927202614, bm: 2344506.8116090195, bn: 781.5022705363399, bo: 790 },
];
const EXP_Ac230_Print: Snap[] = [
  { h: 100, bi: 178900.02083333334, bj: 1789.0002083333334, bm: 232570.02708333335, bn: 2325.7002708333334, bo: 2330 },
  { h: 200, bi: 313900.0416666667, bj: 1569.5002083333334, bm: 408070.05416666664, bn: 2040.3502708333333, bo: 2050 },
  { h: 300, bi: 448900.0625, bj: 1496.3335416666666, bm: 583570.08125, bn: 1945.2336041666667, bo: 1950 },
  { h: 400, bi: 583900.0833333334, bj: 1459.7502083333334, bm: 759070.1083333334, bn: 1897.6752708333336, bo: 1900 },
  { h: 500, bi: 718900.1041666666, bj: 1437.8002083333333, bm: 934570.1354166666, bn: 1869.1402708333333, bo: 1870 },
];
const EXP_BC_Oliver: Snap[] = [
  { h: 1000, bi: 1101668.4276535946, bj: 1101.6684276535946, bm: 1432168.955949673, bn: 1432.1689559496729, bo: 1440 },
  { h: 1500, bi: 1333172.370480392, bj: 888.7815803202612, bm: 1733124.0816245095, bn: 1155.4160544163396, bo: 1160 },
  { h: 2000, bi: 1572176.3133071894, bj: 786.0881566535946, bm: 2043829.207299346, bn: 1021.914603649673, bo: 1030 },
  { h: 2500, bi: 1843680.2561339866, bj: 737.4721024535946, bm: 2396784.3329741824, bn: 958.713733189673, bo: 960 },
  { h: 3000, bi: 2106684.198960784, bj: 702.2280663202613, bm: 2738689.458649019, bn: 912.8964862163396, bo: 920 },
];
const EXP_BC_Print: Snap[] = [
  { h: 100, bi: 241600.02083333334, bj: 2416.0002083333334, bm: 314080.02708333335, bn: 3140.8002708333333, bo: 3150 },
  { h: 200, bi: 431600.0416666667, bj: 2158.0002083333334, bm: 561080.0541666667, bn: 2805.4002708333337, bo: 2810 },
  { h: 300, bi: 621600.0625, bj: 2072.0002083333334, bm: 808080.08125, bn: 2693.6002708333335, bo: 2700 },
  { h: 400, bi: 811600.0833333334, bj: 2029.0002083333334, bm: 1055080.1083333334, bn: 2637.7002708333334, bo: 2640 },
  { h: 500, bi: 1001600.1041666666, bj: 2003.2002083333332, bm: 1302080.1354166665, bn: 2604.160270833333, bo: 2610 },
];
const EXP_Linen_Oliver: Snap[] = [
  { h: 1000, bi: 1505593.2156535948, bj: 1505.5932156535948, bm: 1957271.1803496731, bn: 1957.2711803496732, bo: 1960 },
  { h: 1500, bi: 1905399.153480392, bj: 1270.2661023202613, bm: 2477018.8995245094, bn: 1651.3459330163396, bo: 1660 },
  { h: 2000, bi: 2312705.0913071893, bj: 1156.3525456535947, bm: 3006516.618699346, bn: 1503.258309349673, bo: 1510 },
  { h: 2500, bi: 2752511.029133987, bj: 1101.0044116535948, bm: 3578264.337874183, bn: 1431.3057351496732, bo: 1440 },
  { h: 3000, bi: 3183816.9669607836, bj: 1061.272322320261, bm: 4138962.057049018, bn: 1379.6540190163394, bo: 1380 },
];
const EXP_Linen_Print: Snap[] = [
  { h: 100, bi: 241600.02083333334, bj: 2416.0002083333334, bm: 314080.02708333335, bn: 3140.8002708333333, bo: 3150 },
  { h: 200, bi: 431600.0416666667, bj: 2158.0002083333334, bm: 561080.0541666667, bn: 2805.4002708333337, bo: 2810 },
  { h: 300, bi: 621600.0625, bj: 2072.0002083333334, bm: 808080.08125, bn: 2693.6002708333335, bo: 2700 },
  { h: 400, bi: 811600.0833333334, bj: 2029.0002083333334, bm: 1055080.1083333334, bn: 2637.7002708333334, bo: 2640 },
  { h: 500, bi: 1001600.1041666666, bj: 2003.2002083333332, bm: 1302080.1354166665, bn: 2604.160270833333, bo: 2610 },
];

const P: SertifikatMasterParams = { ...DEFAULT_SERTIFIKAT_PARAMS };
const EPS = 1e-6;
const close = (a: number, b: number) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(b));

let pass = 0, fail = 0;
function check(label: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`[PASS] ${label}`); }
  else { fail++; console.log(`[FAIL] ${label} ${detail}`); }
}

const GRAM: Record<string, number> = { 'Art Carton': 230, 'BC Putih': 200, 'Linen Crem': 300 };
const FILE_SPECS: { tag: string; bahan: SertifikatBahan; mesin: SertifikatMesin; insheet: number; kardus: boolean; exp: Snap[] }[] = [
  { tag: 'Ac230 Oliver', bahan: 'Art Carton', mesin: 'Oliver', insheet: 100, kardus: true, exp: EXP_Ac230_Oliver },
  { tag: 'Ac230 Print', bahan: 'Art Carton', mesin: 'Print Inter', insheet: 7, kardus: false, exp: EXP_Ac230_Print },
  { tag: 'BC Oliver', bahan: 'BC Putih', mesin: 'Oliver', insheet: 100, kardus: true, exp: EXP_BC_Oliver },
  { tag: 'BC Print', bahan: 'BC Putih', mesin: 'Print Inter', insheet: 7, kardus: false, exp: EXP_BC_Print },
  { tag: 'Linen Oliver', bahan: 'Linen Crem', mesin: 'Oliver', insheet: 100, kardus: true, exp: EXP_Linen_Oliver },
  { tag: 'Linen Print', bahan: 'Linen Crem', mesin: 'Print Inter', insheet: 7, kardus: false, exp: EXP_Linen_Print },
];

console.log('=== A. Snapshot Excel tersimpan (30 tier) ===');
for (const fs of FILE_SPECS) {
  for (const s of fs.exp) {
    const r = calculateSertifikatHpp({ oplahPcs: s.h, ukuran: '21 x 29,7', bahan: fs.bahan, gramatur: GRAM[fs.bahan], nWarna: 4, muka: 1, mesin: fs.mesin, finishing: 'None,', foilAktif: false, kardusAktif: fs.kardus, insheetLembar: fs.insheet, marginPct: 30 }, P);
    const ok = close(r.totalHpp, s.bi) && close(r.hppPerPcs, s.bj) && close(r.totalHarga, s.bm) && close(r.hargaPerPcs, s.bn) && r.hargaFinalPerPcs === s.bo;
    check(`${fs.tag} pcs=${s.h} HPP=${r.totalHpp} Final=${r.hargaFinalPerPcs}`,
      ok, `exp BI=${s.bi} BJ=${s.bj} BM=${s.bm} BN=${s.bn} BO=${s.bo} | got BI=${r.totalHpp} BJ=${r.hppPerPcs} BM=${r.totalHarga} BN=${r.hargaPerPcs} BO=${r.hargaFinalPerPcs}`);
  }
}

// Transkripsi independen rumus BUKU
const MESIN_SPEC: Record<string, { o: number; p: number; v: number; w: number; plate: number; min: number; drek: number; over: number }> = {
  'Oliver': { o: 5, p: 10, v: 79, w: 109, plate: 45000, min: 90000, drek: 40, over: 1000 },
  'SM': { o: 2, p: 8, v: 79, w: 109, plate: 78000, min: 310000, drek: 100, over: 3000 },
  'Print Inter': { o: 1, p: 2, v: 32.5, w: 48, plate: 0, min: 0, drek: 0, over: -1 },
  'Ryobi': { o: 11, p: 11, v: 79, w: 109, plate: 10000, min: 15000, drek: 30, over: 500 },
};
const BAHAN_SPEC: Record<string, { kg: number; upOff: number; upPrint: number; t2: number }> = {
  'Art Carton': { kg: 16400, upOff: 5, upPrint: 0, t2: 2700 },
  'BC Putih': { kg: 24100, upOff: 5, upPrint: 5, t2: 3800 },
  'Linen Crem': { kg: 29900, upOff: 0, upPrint: 0, t2: 3800 },
};
function expected(ukuran: SertifikatUkuran, bahan: string, gram: number, w: number, muka: number, mesin: SertifikatMesin, fin: SertifikatFinishing, foil: boolean, kardus: boolean, insheet: number, H: number, margin: number) {
  const M = MESIN_SPEC[mesin];
  const B = BAHAN_SPEC[bahan];
  const dd = ukuran === '21 x 29,7' ? { d: 21, f: 29.7 } : { d: 21.5, f: 33 };
  const up = mesin === 'Print Inter' ? B.upPrint : B.upOff;
  const r = Math.ceil(H / M.p + insheet / M.o);
  const q = r * M.o * muka;
  const w29 = ((M.v * M.w) * gram) / 20000 * ((B.kg * (up / 100)) + B.kg);
  const t = mesin === 'Print Inter' ? q * B.t2 : (w29 / 500) * r;
  const z = w * muka;
  const ad = M.min * z;
  const qover = M.over < 0 ? -1 : q - M.over;
  const ae = qover > 1 ? qover : 0;
  const af = ae <= 0 ? 0 : ae * M.drek * w;
  const ag = af + ad;
  const as = Math.ceil(H / 500) * 5000;
  const lam = (dd.d + 1) * (dd.f + 1) * H;
  const av = fin === 'Laminasi Glossy,' ? (lam * 0.35 === 0 ? 0 : lam * 0.35 > 50000 ? lam * 0.35 : 50000) : 0;
  const ay = fin === 'Laminasi Doff,' ? (lam * 0.4 === 0 ? 0 : lam * 0.4 > 50000 ? lam * 0.4 : 50000) : 0;
  const bb = fin === 'UV Varnish,' ? (lam * 0.12 === 0 ? 0 : lam * 0.12 > 50000 ? lam * 0.12 : 50000) : 0;
  const be = (H / 1000) / (7650 / 196);
  const bg = kardus ? Math.ceil(H / 1000) * 8500 + 8000 * be : 0;
  const ao = ((2818585 / 25) / 500 * H) * 2;
  const ap = foil ? ao + 53200 * 2 + (H / 4800) * 295000 : 0;
  const ak = H / 4800;
  const bi = t + 20000 + M.plate * z + ag + 0 + 0 + as + av + ay + bb + bg + ap + ak;
  const bj = bi / H;
  const bm = (bj + bj * (margin / 100)) * H;
  return { bi, bo: Math.ceil((bm / H) / 10) * 10 };
}

console.log('=== B. Matriks permutasi (2 ukuran × 3 bahan × 3 gram × 4 warna × 2 muka × 4 mesin × 4 finishing × 2 foil × 2 kardus × 10 tier) sampling ===');
const TIERS = [100, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000];
const GRAMS: Record<string, number[]> = { 'Art Carton': [150, 230, 260], 'BC Putih': [150, 200, 260], 'Linen Crem': [260, 300, 310] };
const FINS: SertifikatFinishing[] = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,'];
let permPass = 0, permFail = 0;
for (const uk of ['21 x 29,7', '21,5 x 33'] as SertifikatUkuran[])
  for (const bh of ['Art Carton', 'BC Putih', 'Linen Crem'] as SertifikatBahan[])
    for (const gr of GRAMS[bh])
      for (let w = 1; w <= 4; w++)
        for (const mu of [1, 2])
          for (const mc of ['Oliver', 'SM', 'Print Inter', 'Ryobi'] as SertifikatMesin[])
            for (const fn of FINS)
              for (const fl of [false, true])
                for (const kd of [false, true]) {
                  const insheet = mc === 'Print Inter' ? 7 : 100;
                  for (const h of TIERS) {
                    const r = calculateSertifikatHpp({ oplahPcs: h, ukuran: uk, bahan: bh, gramatur: gr, nWarna: w as 1 | 2 | 3 | 4, muka: mu as 1 | 2, mesin: mc, finishing: fn, foilAktif: fl, kardusAktif: kd, insheetLembar: insheet, marginPct: 30 }, P);
                    const e = expected(uk, bh, gr, w, mu, mc, fn, fl, kd, insheet, h, 30);
                    if (close(r.totalHpp, e.bi) && r.hargaFinalPerPcs === e.bo) permPass++;
                    else { permFail++; if (permFail <= 10) console.log(`[FAIL] ${uk}/${bh}/${gr}/${w}W/m${mu}/${mc}/${fn}/${fl ? 'F' : '-'}/${kd ? 'K' : '-'}/pcs${h}: got ${r.totalHpp}/${r.hargaFinalPerPcs} exp ${e.bi}/${e.bo}`); }
                  }
                }
console.log(`Permutasi: ${permPass} PASSED, ${permFail} FAILED (0 selisih)`);
if (permFail === 0) pass++; else fail++;

console.log('=== C. Reaktivitas parameter (Delta HPP > 0) ===');
const base = { oplahPcs: 1000, ukuran: '21 x 29,7' as SertifikatUkuran, bahan: 'Art Carton' as SertifikatBahan, gramatur: 230, nWarna: 4 as const, muka: 1 as const, mesin: 'Oliver' as SertifikatMesin, finishing: 'None,' as SertifikatFinishing, foilAktif: false, kardusAktif: true, insheetLembar: 100, marginPct: 30 };
const hpp = (p: SertifikatMasterParams) => calculateSertifikatHpp(base, p).totalHpp;
const baseHpp = hpp(P);
const tests: [string, SertifikatMasterParams][] = [
  ['HargaKgAc 16400→20000', { ...P, hargaKgAc: 20000 }],
  ['UpAcOffset 5→10', { ...P, upAcOffset: 10 }],
  ['Gramatur 230→310', { ...P }],
  ['Desain 20000→50000', { ...P, desain: 50000 }],
  ['Royalty 0→500/pcs', { ...P, royaltyPerPcs: 500 }],
  ['Transport 0→20000', { ...P, transportPerOrder: 20000 }],
  ['Sisir 5000→8000', { ...P, tarifSisir: 8000 }],
  ['Kardus 8500→12000', { ...P, tarifKardusBox: 12000 }],
  ['Lakban 8000→15000', { ...P, tarifLakbanRoll: 15000 }],
  ['FoilPlastik 295000→400000', { ...P, tarifFoilPlastikRoll: 400000 }],
  ['Plat override 0→8', { ...P, platOverride: 8 }],
];
for (const [label, mp] of tests) {
  const got = label.startsWith('Gramatur') ? calculateSertifikatHpp({ ...base, gramatur: 310 }, P).totalHpp
    : label.startsWith('FoilPlastik') ? calculateSertifikatHpp({ ...base, foilAktif: true }, mp).totalHpp
    : hpp(mp);
  check(`Reaktivitas: ${label} | ${baseHpp} -> ${got}`, got - baseHpp > 0, `delta=${got - baseHpp}`);
}
const t2 = calculateSertifikatHpp({ ...base, mesin: 'Print Inter', insheetLembar: 7, kardusAktif: false }, P).totalHpp;
const t2b = calculateSertifikatHpp({ ...base, mesin: 'Print Inter', insheetLembar: 7, kardusAktif: false }, { ...P, tarifPrintAc: 5000 }).totalHpp;
check(`Reaktivitas: TarifPrintAc 2700→5000 | ${t2} -> ${t2b}`, t2b - t2 > 0, `delta=${t2b - t2}`);
const lam = calculateSertifikatHpp({ ...base, finishing: 'Laminasi Glossy,' }, P).totalHpp;
check(`Reaktivitas: None→Laminasi Glossy | ${baseHpp} -> ${lam}`, lam - baseHpp > 0, `delta=${lam - baseHpp}`);
const foil = calculateSertifikatHpp({ ...base, foilAktif: true }, P).totalHpp;
check(`Reaktivitas: Foil X→√ | ${baseHpp} -> ${foil}`, foil - baseHpp > 0, `delta=${foil - baseHpp}`);
const kardus = calculateSertifikatHpp({ ...base, kardusAktif: false }, P).totalHpp;
check(`Reaktivitas: Kardus √→X | ${baseHpp} -> ${kardus}`, baseHpp - kardus > 0, `delta=${baseHpp - kardus}`);

console.log('========================================================================================');
console.log(`HASIL AKHIR BENCHMARK: ${pass} LULUS, ${fail} GAGAL`);
console.log('========================================================================================');
process.exit(fail > 0 ? 1 : 0);
