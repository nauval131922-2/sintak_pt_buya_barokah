// Benchmark Amplop: snapshot Excel tersimpan (39 tier) + matriks permutasi + reaktivitas.
// Acuan: Harga AMPLOP JADI - Besar 1 Warna / Besar FC / Tgg FC (.xlsm), sheet BUKU.
import { calculateAmplopHpp, DEFAULT_AMPLOP_PARAMS, AmplopMasterParams, AmplopUkuran, AmplopMesin } from '../src/lib/amplop-calculator';

type Snap = { h: number; ai: number; aj: number; ak: number; an: number; ao: number; ap: number; aq: number };
const EXP_BESAR1W: Snap[] = [
  { h: 100, ai: 55750, aj: 557.5, ak: 55750, an: 72475, ao: 724.75, ap: 72475, aq: 72475 },
  { h: 200, ai: 81500, aj: 407.5, ak: 40750, an: 105950, ao: 529.75, ap: 52975, aq: 52975 },
  { h: 300, ai: 107250, aj: 357.5, ak: 35750, an: 139425, ao: 464.75, ap: 46475, aq: 46475 },
  { h: 400, ai: 133000, aj: 332.5, ak: 33250, an: 172900, ao: 432.25, ap: 43225, aq: 43225 },
  { h: 500, ai: 159200, aj: 318.4, ak: 31840, an: 206959.99999999997, ao: 413.91999999999996, ap: 41391.99999999999, aq: 41392 },
  { h: 600, ai: 188040, aj: 313.4, ak: 31340, an: 244451.99999999997, ao: 407.41999999999996, ap: 40741.99999999999, aq: 40742 },
  { h: 700, ai: 216880, aj: 309.8285714285714, ak: 30982.85714285714, an: 281944, ao: 402.77714285714285, ap: 40277.71428571428, aq: 40278 },
  { h: 800, ai: 245720, aj: 307.15, ak: 30715, an: 319435.99999999994, ao: 399.2949999999999, ap: 39929.49999999999, aq: 39930 },
  { h: 900, ai: 274560, aj: 305.06666666666666, ak: 30506.666666666668, an: 356928, ao: 396.58666666666664, ap: 39658.666666666664, aq: 39659 },
  { h: 1000, ai: 387920, aj: 387.92, ak: 38792, an: 504296.00000000006, ao: 504.29600000000005, ap: 50429.600000000006, aq: 50430 },
  { h: 2000, ai: 762840, aj: 381.42, ak: 38142, an: 991692, ao: 495.846, ap: 49584.6, aq: 49585 },
  { h: 3000, ai: 1137760, aj: 379.25333333333333, ak: 37925.333333333336, an: 1479088, ao: 493.02933333333334, ap: 49302.933333333334, aq: 49303 },
  { h: 5000, ai: 1887600, aj: 377.52, ak: 37752, an: 2453880, ao: 490.776, ap: 49077.6, aq: 49078 },
];
const EXP_BESARFC: Snap[] = [
  { h: 100, ai: 55030, aj: 550.3, ak: 55030, an: 71538.99999999999, ao: 715.3899999999999, ap: 71538.99999999999, aq: 71539 },
  { h: 200, ai: 107560, aj: 537.8, ak: 53780, an: 139827.99999999997, ao: 699.1399999999999, ap: 69913.99999999999, aq: 69914 },
  { h: 300, ai: 160090, aj: 533.6333333333333, ak: 53363.333333333336, an: 208117, ao: 693.7233333333334, ap: 69372.33333333333, aq: 69373 },
  { h: 400, ai: 212620, aj: 531.55, ak: 53155, an: 276405.99999999994, ao: 691.0149999999999, ap: 69101.49999999999, aq: 69102 },
  { h: 500, ai: 265150, aj: 530.3, ak: 53030, an: 344694.99999999994, ao: 689.3899999999999, ap: 68938.99999999999, aq: 68939 },
  { h: 600, ai: 317680, aj: 529.4666666666667, ak: 52946.666666666664, an: 412984.00000000006, ao: 688.3066666666667, ap: 68830.66666666667, aq: 68831 },
  { h: 700, ai: 370210, aj: 528.8714285714286, ak: 52887.142857142855, an: 481273.00000000006, ao: 687.5328571428572, ap: 68753.28571428572, aq: 68754 },
  { h: 800, ai: 422740, aj: 528.425, ak: 52842.5, an: 549561.9999999999, ao: 686.9524999999999, ap: 68695.24999999999, aq: 68696 },
  { h: 900, ai: 475270, aj: 528.0777777777778, ak: 52807.77777777778, an: 617851, ao: 686.5011111111111, ap: 68650.11111111111, aq: 68651 },
  { h: 1000, ai: 525300, aj: 525.3, ak: 52530, an: 682889.9999999999, ao: 682.8899999999999, ap: 68288.99999999999, aq: 68289 },
  { h: 2000, ai: 1050600, aj: 525.3, ak: 52530, an: 1365779.9999999998, ao: 682.8899999999999, ap: 68288.99999999999, aq: 68289 },
  { h: 3000, ai: 1575900, aj: 525.3, ak: 52530, an: 2048669.9999999995, ao: 682.8899999999999, ap: 68288.99999999999, aq: 68289 },
  { h: 5000, ai: 2626500, aj: 525.3, ak: 52530, an: 3414449.9999999995, ao: 682.8899999999999, ap: 68288.99999999999, aq: 68289 },
];
const EXP_TGGFC: Snap[] = [
  { h: 100, ai: 40000, aj: 400, ak: 40000, an: 52000, ao: 520, ap: 52000, aq: 52000 },
  { h: 200, ai: 75000, aj: 375, ak: 37500, an: 97500, ao: 487.5, ap: 48750, aq: 48750 },
  { h: 300, ai: 110000, aj: 366.6666666666667, ak: 36666.666666666664, an: 143000, ao: 476.6666666666667, ap: 47666.666666666664, aq: 47667 },
  { h: 400, ai: 145000, aj: 362.5, ak: 36250, an: 188500, ao: 471.25, ap: 47125, aq: 47125 },
  { h: 500, ai: 180000, aj: 360, ak: 36000, an: 234000, ao: 468, ap: 46800, aq: 46800 },
  { h: 600, ai: 215000, aj: 358.3333333333333, ak: 35833.333333333336, an: 279500, ao: 465.8333333333333, ap: 46583.333333333336, aq: 46584 },
  { h: 700, ai: 250000, aj: 357.14285714285717, ak: 35714.28571428572, an: 325000.00000000006, ao: 464.2857142857144, ap: 46428.571428571435, aq: 46429 },
  { h: 800, ai: 285000, aj: 356.25, ak: 35625, an: 370500, ao: 463.125, ap: 46312.5, aq: 46313 },
  { h: 900, ai: 320000, aj: 355.55555555555554, ak: 35555.555555555555, an: 415999.99999999994, ao: 462.2222222222222, ap: 46222.22222222222, aq: 46223 },
  { h: 1000, ai: 350000, aj: 350, ak: 35000, an: 455000, ao: 455, ap: 45500, aq: 45500 },
  { h: 2000, ai: 700000, aj: 350, ak: 35000, an: 910000, ao: 455, ap: 45500, aq: 45500 },
  { h: 3000, ai: 1050000, aj: 350, ak: 35000, an: 1365000, ao: 455, ap: 45500, aq: 45500 },
  { h: 5000, ai: 1750000, aj: 350, ak: 35000, an: 2275000, ao: 455, ap: 45500, aq: 45500 },
];

const P: AmplopMasterParams = { ...DEFAULT_AMPLOP_PARAMS };
const EPS = 1e-6;
const close = (a: number, b: number) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(b));

let pass = 0, fail = 0;
function check(label: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`[PASS] ${label}`); }
  else { fail++; console.log(`[FAIL] ${label} ${detail}`); }
}

// Spesifikasi tiap file tersimpan.
// paramsFile = nilai asli file tsb (jawaban STOP&ASK: P2 Besar FC = 51000/51000,
// berbeda dari default unifikasi 55000/5000 pilihan user) — validasi engine vs file.
const FILE_SPECS: { tag: string; ukuran: AmplopUkuran; nWarna: 1 | 2 | 3 | 4; mesin: AmplopMesin; insheet: number; desain: number; paramsFile: AmplopMasterParams; exp: Snap[] }[] = [
  { tag: 'Besar 1W Ryobi', ukuran: '11 x 23', nWarna: 1, mesin: 'Ryobi', insheet: 10, desain: 5000, paramsFile: P, exp: EXP_BESAR1W },
  { tag: 'Besar FC Ungu', ukuran: '11 x 23', nWarna: 4, mesin: 'Print Ungu', insheet: 0, desain: 2500, paramsFile: { ...P, tarifPrintUnguBesar: 51000, tarifPrintBuyaBesar: 51000 }, exp: EXP_BESARFC },
  { tag: 'Tgg FC Ungu', ukuran: '9,5 x 15,5', nWarna: 4, mesin: 'Print Ungu', insheet: 0, desain: 5000, paramsFile: P, exp: EXP_TGGFC },
];

console.log('=== A. Snapshot Excel tersimpan (39 tier) ===');
for (const fs of FILE_SPECS) {
  for (const s of fs.exp) {
    const r = calculateAmplopHpp({ oplahPcs: s.h, ukuran: fs.ukuran, nWarna: fs.nWarna, mesin: fs.mesin, insheetLembar: fs.insheet, desain: fs.desain, marginPct: 30 }, fs.paramsFile);
    const ok = close(r.totalHpp, s.ai) && close(r.hppPerPcs, s.aj) && close(r.hppPerPack, s.ak)
      && close(r.totalHarga, s.an) && close(r.hargaPerPcs, s.ao) && close(r.hargaPerPack, s.ap) && r.hargaFinalPerPack === s.aq;
    check(`${fs.tag} pcs=${s.h} HPP=${r.totalHpp} FinalPack=${r.hargaFinalPerPack}`,
      ok, `exp AI=${s.ai} AJ=${s.aj} AK=${s.ak} AN=${s.an} AO=${s.ao} AP=${s.ap} AQ=${s.aq} | got AI=${r.totalHpp} AJ=${r.hppPerPcs} AK=${r.hppPerPack} AN=${r.totalHarga} AO=${r.hargaPerPcs} AP=${r.hargaPerPack} AQ=${r.hargaFinalPerPack}`);
  }
}

// Transkripsi independen rumus BUKU
function expected(ukuran: AmplopUkuran, w: number, mesin: AmplopMesin, insheet: number, desain: number, H: number, margin: number) {
  const isBesar = ukuran === '11 x 23';
  const isRyobi = mesin === 'Ryobi';
  const k = isBesar ? 0.03 * H : insheet;
  const n = H + k;
  const rate = isRyobi ? (isBesar ? 25000 : 15800)
    : isBesar ? (mesin === 'Print Ungu' ? 55000 : 50000) : (mesin === 'Print Ungu' ? 35000 : 35000);
  const p = (n / 100) * rate;
  const r = H >= 1000 ? 0 : desain;
  const v = w;
  const u = isRyobi ? 10000 * v : 0;
  const z = (isRyobi ? 15000 : 0) * v;
  const aa = isRyobi && n - 500 > 1 ? n - 500 : 0;
  const ab = (aa === 0 ? 0 : (aa > 1 ? aa : 0)) * (isRyobi ? 30 : 0) * v;
  const ac = isRyobi ? ab + z : 0;
  const ae = 0;
  const base = ac + u + r + p;
  const af = isRyobi && H >= 1000 ? base * 0.2 : 0;
  const ag = isRyobi && H >= 1000 ? base * 0.1 : 0;
  const ai = ag + af + ae + ac + u + r + p;
  const aj = ai / H;
  const an = (aj + aj * (margin / 100)) * H;
  const ap = an / (H / 100);
  return { ai, aq: Math.ceil(ap) };
}

console.log('=== B. Matriks permutasi (2 ukuran × 4 warna × 3 mesin × 13 tier) ===');
const TIERS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 5000];
let permPass = 0, permFail = 0;
for (const uk of ['9,5 x 15,5', '11 x 23'] as AmplopUkuran[]) {
  for (let w = 1; w <= 4; w++) {
    for (const mc of ['Print Ungu', 'Print Buya', 'Ryobi'] as AmplopMesin[]) {
      const insheet = uk === '11 x 23' ? 10 : 0; // Besar: mati (K2=3%) — nilai sembarang, wajib tak berpengaruh
      const desain = uk === '11 x 23' && mc !== 'Ryobi' ? 2500 : 5000;
      for (const h of TIERS) {
        const r = calculateAmplopHpp({ oplahPcs: h, ukuran: uk, nWarna: w as 1 | 2 | 3 | 4, mesin: mc, insheetLembar: insheet, desain, marginPct: 30 }, P);
        const e = expected(uk, w, mc, insheet, desain, h, 30);
        // Uji anti-hijacking insheet: Besar wajib tak peduli nilai insheet
        const rAlt = uk === '11 x 23'
          ? calculateAmplopHpp({ oplahPcs: h, ukuran: uk, nWarna: w as 1 | 2 | 3 | 4, mesin: mc, insheetLembar: 999, desain, marginPct: 30 }, P)
          : r;
        if (close(r.totalHpp, e.ai) && r.hargaFinalPerPack === e.aq && rAlt.totalHpp === r.totalHpp) permPass++;
        else { permFail++; console.log(`[FAIL] ${uk}/${w}W/${mc}/pcs${h}: got ${r.totalHpp}/${r.hargaFinalPerPack} exp ${e.ai}/${e.aq} alt=${rAlt.totalHpp}`); }
      }
    }
  }
}
console.log(`Permutasi: ${permPass} PASSED, ${permFail} FAILED (0 selisih)`);
if (permFail === 0) pass++; else fail++;

console.log('=== C. Reaktivitas parameter (Delta HPP > 0) ===');
const base = { oplahPcs: 300, ukuran: '11 x 23' as AmplopUkuran, nWarna: 1 as const, mesin: 'Ryobi' as AmplopMesin, insheetLembar: 10, desain: 5000, marginPct: 30 };
const hpp = (p: AmplopMasterParams) => calculateAmplopHpp(base, p).totalHpp;
const baseHpp = hpp(P);
const tests: [string, AmplopMasterParams][] = [
  ['HargaPackBesar 25000→30000', { ...P, hargaPackBesar: 30000 }],
  ['Desain 5000→20000', { ...P }],
  ['BTKL 20→30 (H=2000)', { ...P, btklPct: 30 }],
  ['BOP 10→20 (H=2000)', { ...P, bopPct: 20 }],
  ['Transport 0→5000 (H=700)', { ...P, transportPerOrder: 5000 }],
  ['Plat override 0→5', { ...P, platOverride: 5 }],
  ['PrintUnguBesar 55000→60000', { ...P, tarifPrintUnguBesar: 60000 }],
];
for (const [label, mp] of tests) {
  let got: number;
  if (label.startsWith('Desain')) got = calculateAmplopHpp({ ...base, desain: 20000 }, P).totalHpp;
  else if (label.startsWith('BTKL') || label.startsWith('BOP')) got = calculateAmplopHpp({ ...base, oplahPcs: 2000 }, mp).totalHpp;
  else if (label.startsWith('Transport')) got = calculateAmplopHpp({ ...base, oplahPcs: 700 }, mp).totalHpp;
  else if (label.startsWith('PrintUngu')) got = calculateAmplopHpp({ ...base, mesin: 'Print Ungu', desain: 2500 }, mp).totalHpp;
  else got = hpp(mp);
  check(`Reaktivitas: ${label} | ${baseHpp} -> ${got}`, got - baseHpp > 0, `delta=${got - baseHpp}`);
}
const tgg = calculateAmplopHpp({ ...base, ukuran: '9,5 x 15,5', insheetLembar: 0, desain: 5000 }, P).totalHpp;
const tgg2 = calculateAmplopHpp({ ...base, ukuran: '9,5 x 15,5', insheetLembar: 50, desain: 5000 }, P).totalHpp;
check(`Reaktivitas: Insheet Tgg 0→50 | ${tgg} -> ${tgg2}`, tgg2 - tgg > 0, `delta=${tgg2 - tgg}`);
const w4 = calculateAmplopHpp({ ...base, nWarna: 4 }, P).totalHpp;
check(`Reaktivitas: 1 Warna→4 Warna | ${baseHpp} -> ${w4}`, w4 - baseHpp > 0, `delta=${w4 - baseHpp}`);
const buya = calculateAmplopHpp({ ...base, mesin: 'Print Buya', desain: 2500 }, P).totalHpp;
check(`Reaktivitas: Ryobi→Print Buya | ${baseHpp} -> ${buya}`, buya - baseHpp !== 0, `delta=${buya - baseHpp}`);

console.log('========================================================================================');
console.log(`HASIL AKHIR BENCHMARK: ${pass} LULUS, ${fail} GAGAL`);
console.log('========================================================================================');
process.exit(fail > 0 ? 1 : 0);
