// Benchmark parity Soft Cover Offset (3 combo) vs cache Excel (BUKU tiers + komponen + DI).
// Expected: scripts/bsc2-expected.json (hasil cache formula Excel, BUKAN hitungan SINTAK).
import { readFileSync } from 'fs';
import {
  calculateSoftCoverOffsetHpp,
  DEFAULT_SOFT_COVER_OFFSET_PARAMS,
  SOFT_COVER_OFFSET_COMBOS,
  defaultSoftCoverOffsetParams,
  SoftCoverOffsetComboId,
  SoftCoverOffsetMukaType,
  SoftCoverOffsetWarnaType,
  SoftCoverOffsetFinishingType,
} from '../src/lib/buku-soft-cover-offset-calculator';

const EXPECTED: Record<string, any[]> = JSON.parse(readFileSync('scripts/bsc2-expected.json', 'utf8'));
const EXPECTED14: Record<string, any[]> = JSON.parse(readFileSync('scripts/bsc3-expected.json', 'utf8'));
const D = DEFAULT_SOFT_COVER_OFFSET_PARAMS;
const COMBOS = [...Object.keys(EXPECTED), ...Object.keys(EXPECTED14)] as SoftCoverOffsetComboId[];
const EXP_ALL: Record<string, any[]> = { ...EXPECTED, ...EXPECTED14 };
// Master bawaan per file = default per combo:
const FILE_P: Record<string, any> = {};
for (const c of COMBOS) FILE_P[c] = defaultSoftCoverOffsetParams(c);

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, a: number, b: number) => {
  if (a === b) pass++;
  else { fail++; if (fails.length < 25) fails.push(`${label}: sintak=${a} excel=${b} selisih=${a - b}`); }
};
const byName = (r: any, prefix: string) => r.breakdown.filter((x: any) => x.nama === prefix || x.nama.startsWith(prefix + ' '));

// ---------- 1. PARITY saved-state (32 hal, 1 Muka, 4W cover, 1W isi, None,, margin 30) ----------
const COMP: Array<[string, string]> = [
  ['Kertas Cover', 'T'], ['Desain Cover', 'V'], ['Plate Cover', 'Y'], ['Ongkos Cetak Cover', 'AG'],
  ['Kertas Isi HVS', 'AR'], ['Desain Isi', 'AT'], ['Plate Isi', 'AW'], ['Cetak Isi', 'BD'],
  ['Royalty', 'BF'], ['Jasa BI', 'BI'], ['Jasa BJ', 'BJ'], ['Jasa BK', 'BK'], ['Kawat Stiching', 'BL'],
  ['Jasa BM', 'BM'], ['Jasa BN', 'BN'], ['Steples', 'BO'], ['Sisir', 'BQ'],
  ['Bending', 'CC'], ['Laminasi Glossy', 'CG'], ['Laminasi Doff', 'CJ'], ['UV Varnish', 'CM'],
  ['UV Varnish + Bending', 'CO'], ['Laminasi Glossy + Bending', 'CP'], ['Laminasi Doff + Bending', 'CQ'],
  ['Packing Kardus & Lakban', 'DA'],
];
// BT/BV/BY/BZ/CT/CV mentah tanpa gate (tidak masuk DC) — yang masuk DC adalah gated BW/CA/CW:
const COMBO_COMP: Array<[string[], string]> = [
  [['Tinta Spot UV', 'Jasa Spot UV'], 'BW'],
  [['Klise Emboss', 'Jasa Emboss'], 'CA'],
  [['Plastik Shrink', 'Jasa Shrink + Packing'], 'CW'],
];
for (const c of COMBOS) {
  for (const t of EXP_ALL[c]) {
    const r = calculateSoftCoverOffsetHpp(
      { oplah: t.H, jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'None,', marginPct: 30 },
      { ...D, ...FILE_P[c] }, c);
    check(`${c}@${t.H} R`, r.kebutuhanKertasCover, t.R);
    check(`${c}@${t.H} Q`, r.kebutuhanCetakCover, t.Q);
    check(`${c}@${t.H} AP`, r.kebutuhanPlanoIsi, t.AP);
    for (const [nm, col] of COMP) {
      const items = byName(r, nm);
      const exp = t[col];
      if (items.length && exp !== null && exp !== undefined) {
        const got = items.reduce((s: number, x: any) => s + x.nominal, 0);
        check(`${c}@${t.H} ${nm}`, got, Math.round(exp));
      } else if (!items.length && exp) check(`${c}@${t.H} ${nm} MISSING`, 0, Math.round(exp));
    }
    for (const [nms, col] of COMBO_COMP) {
      const got = r.breakdown.filter((x: any) => nms.includes(x.nama)).reduce((s: number, x: any) => s + x.nominal, 0);
      const exp = t[col];
      if (exp !== null && exp !== undefined) check(`${c}@${t.H} ${col}`, got, Math.round(exp));
    }
    check(`${c}@${t.H} DC`, r.totalHpp, Math.round(t.DC));
    check(`${c}@${t.H} DI`, r.hargaJualPerPcs, t.DI);
  }
}

// ---------- 2. ORACLE independen untuk permutasi ----------
function oracle(o: {
  H: number; hal: number; combo: SoftCoverOffsetComboId; muka: SoftCoverOffsetMukaType;
  wc: SoftCoverOffsetWarnaType; wi: SoftCoverOffsetWarnaType;
  fin: SoftCoverOffsetFinishingType; margin: number; p: typeof D;
}) {
  const cfg = SOFT_COVER_OFFSET_COMBOS[o.combo];
  const is14 = cfg.ukuran === '14,5 x 20,25';
  const D7 = is14 ? 14.5 : 21, F7 = is14 ? 20.25 : 29.7;
  const N = o.muka === '1 Muka' ? 1 : 2;
  const M = o.hal <= 100 ? 0.5 : o.hal <= 200 ? 0.7 : o.hal <= 300 ? 1.5 : o.hal <= 400 ? 2 : o.hal <= 500 ? 2.5 : o.hal <= 600 ? 2.5 : 2.8;
  const Z2 = Number(o.wc[0]);
  const AJ = Number(o.wi[0]);
  const K = o.p.insheetCover;
  const O = cfg.potongCover, P = cfg.coverPerPlano;
  const R = o.H > 0 ? (is14 ? Math.ceil(o.H / P + K / O) : o.H / P + K / O) : 0;
  const Q = R * O * N;
  const [cvW, cvH] = is14
    ? (cfg.coverMesin === 'Oliver' ? [65, 100] : cfg.coverMesin === 'Print Inter' ? [32.5, 48] : [21.5, 33])
    : (cfg.coverMesin === 'Oliver' ? [65, 100] : cfg.coverMesin === 'Print Inter' ? [32.5, 48] : [29.7, 42]);
  const rimC = ((cvW * cvH) * o.p.gramaturCover) / 20000 * (o.p.tarifKertasCoverKg * (1 + o.p.upCoverPct / 100));
  const T = cfg.coverMesin === 'Oliver' ? (R / 500) * rimC : o.p.tarifPrintCoverA3 * R;
  const V = o.H > 0 ? o.p.tarifDesainCover : 0;
  const covOff = cfg.coverMesin === 'Oliver';
  const Y = covOff && o.H > 0 ? cfg.plateCoverY6 * Z2 : 0;
  const AB = covOff && o.H > 0 ? cfg.minCoverAB6 : 0;
  const AD = AB * Z2;
  const ovc = covOff && Q - 1000 > 1 ? Q - 1000 : 0;
  const AF = ovc === 0 ? 0 : ovc * cfg.drekCoverAC6 * Z2;
  const AG = covOff ? AF + AD : 0;
  const AI = o.H > 0 ? o.p.insheetIsi : 0;
  const [AK, AL, AM] = cfg.isiAKALAM;
  const AN = o.hal / (AM / AL);
  const AN6 = Math.ceil(AN);
  const AO = ((o.H / AL) * AN + (AI / AL) * AN6) * AL;
  const AP = o.H > 0 ? ((o.H / AL) * AN + (AI / AL) * AN6) : 0;
  const [iaW, iaH] = is14
    ? (cfg.isiMesin === 'SM' ? [61, 86] : cfg.isiMesin === 'Oliver' ? [65, 100] : [21.5, 33])
    : (cfg.isiMesin === 'Oliver' ? (o.wi === '1 Warna' ? [61, 86] : [65, 100]) : [29.7, 42]);
  const rimI = ((iaW * iaH) * o.p.gramaturIsi) / 20000 * (o.p.tarifKertasIsiKg * (1 + o.p.upIsiPct / 100));
  const AR = (AP / 500) * rimI;
  const C7 = o.hal / 4;
  const AT = o.H > 0 ? o.p.tarifDesainIsiPerUnit * C7 : 0;
  const AX = Math.ceil(o.hal / AK) * AJ;
  const isiOff = cfg.isiMesin === 'Oliver' || cfg.isiMesin === 'Ryobi';
  const AW = isiOff && o.H > 0 ? cfg.plateIsiY6 * AX : 0;
  const BA = isiOff && o.H > 0 ? cfg.minIsiY6 * AX : 0;
  const amb = cfg.isiMesin === 'Oliver' ? 1000 : 500;
  const BB = isiOff && (o.H + AI - amb) * AX > 1 ? (o.H + AI - amb) * AX : 0;
  const BD = cfg.isiMesin === 'Print Buya' ? cfg.jasaBuyaAR2 * AO : BB * cfg.drekIsiZ + BA;
  const umrH = o.p.umr / 25;
  let BI = 0, BJ = 0, BK = 0, BL = 0, BM = 0, BN = 0, BO = 0;
  if (cfg.jasaModel === 'UMR5') {
    BI = ((umrH / 10000) * AN6) * o.H; BJ = ((umrH / 1700)) * o.H; BK = ((umrH / 9500) * AN6) * o.H;
    BL = (o.p.tarifKawatRoll / 25500) * o.H; BM = ((umrH * 2) / 10000) * o.H;
  } else {
    const tgt = is14
      ? (o.hal <= 20 ? 900 : o.hal <= 30 ? 900 : o.hal <= 40 ? 800 : o.hal <= 50 ? 800 : o.hal <= 60 ? 800 : o.hal <= 70 ? 800 : 700)
      : (o.hal <= 20 ? 600 : o.hal <= 30 ? 550 : o.hal <= 40 ? 500 : o.hal <= 50 ? 450 : o.hal <= 60 ? 400 : o.hal <= 70 ? 350 : 300);
    BN = o.H * (umrH / tgt); BO = (o.p.tarifSteplesPack / (1000 / 3)) * o.H;
  }
  const BQ = o.H * o.p.tarifSisirPerPcs;
  const full = o.fin === 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,';
  const BS6 = 5393320 / 4 / (((D7 * 2) + M) * F7);
  const BT = full ? (o.H / BS6) * o.p.tarifTintaSpotUV : 0;
  const BV = full ? (umrH / 500) * o.H : 0;
  const BY = full && o.H > 0 ? ((D7 + 4) * (F7 + 4)) * 500 * 2 : 0;
  const BZ = full ? o.H * (umrH / 1000) : 0;
  const bendOn = o.fin === 'Lem Bending,' || full;
  const CD = o.p.tarifBending * F7 * M * o.H;
  const CC = bendOn ? CD : 0;
  const luas = (D7 * 2 + 1) * (F7 + 1);
  const fl = (raw: number) => (raw === 0 ? 0 : raw > o.p.minFinishing ? raw : o.p.minFinishing);
  const CG = o.fin === 'Laminasi Glossy,' ? fl(luas * o.p.tarifLaminasiGlossy * o.H * N) : 0;
  const CJ = o.fin === 'Laminasi Doff,' || full ? fl(luas * o.p.tarifLaminasiDoff * o.H * N) : 0;
  const CM = o.fin === 'UV Varnish,' ? fl(luas * o.p.tarifUvVarnish * o.H * N) : 0;
  const CE = CD === 0 ? 0 : CD > o.p.minBending ? CD : o.p.minBending;
  const CO = o.fin === 'UV Varnish + Bending,' ? fl(luas * o.p.tarifUvVarnish * o.H * N) + CE : 0;
  const CP = o.fin === 'Laminasi Glossy + Bending,' ? fl(luas * o.p.tarifLaminasiGlossy * o.H * N) + CE : 0;
  const CQ = o.fin === 'Laminasi Doff + Bending,' ? fl(luas * o.p.tarifLaminasiDoff * o.H * N) + CE : 0;
  const CS = o.H / (106700 / (F7 + 8));
  const CWon = o.fin === 'Laminasi Glossy + Bending,' || full;
  const CW = CWon ? (((umrH * 2) / 500) * o.H + CS * o.p.tarifShrinkRoll) : 0;
  const CY = (o.H / (o.hal <= 100 ? 200 : o.hal <= 200 ? 150 : o.hal <= 300 ? 100 : o.hal <= 400 ? 90 : o.hal <= 500 ? 80 : o.hal <= 600 ? 70 : 50)) / (7650 / 196);
  const DA = Math.ceil(o.H / (o.hal <= 100 ? 200 : o.hal <= 200 ? 150 : o.hal <= 300 ? 100 : o.hal <= 400 ? 90 : o.hal <= 500 ? 80 : o.hal <= 600 ? 70 : 50)) * o.p.tarifKardusBox + o.p.tarifLakbanRoll * CY;
  const DC = T + V + Y + AG + AR + AT + AW + BD + BI + BJ + BK + BL + BM + BN + BO + BQ + BT + BV + BY + BZ + CC + CG + CJ + CM + CO + CP + CQ + CW + DA;
  const DD = o.H > 0 ? DC / o.H : 0;
  const DI = o.H > 0 ? Math.ceil((DD * (1 + o.margin / 100)) / 10) * 10 : 0;
  return { DC: Math.round(DC), DI };
}

const MUKAS: SoftCoverOffsetMukaType[] = ['1 Muka', '2 Muka'];
const WS: SoftCoverOffsetWarnaType[] = ['1 Warna', '2 Warna', '3 Warna', '4 Warna'];
const FINS: SoftCoverOffsetFinishingType[] = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,', 'Lem Bending,', 'UV Varnish + Bending,', 'Laminasi Glossy + Bending,', 'Laminasi Doff + Bending,', 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,'];
const SUB_TIERS: Record<string, number[]> = {
  'Oliver-Oliver': [550, 1000, 3000],
  'Print-Oliver': [300, 400, 500],
  'Print-Print': [20, 100, 250],
  'OO-14': [1000, 2000, 3000],
  'OR-14': [650, 800, 900],
  'PP-14': [20, 100, 200],
  'PR-14': [250, 400, 600],
};
let permCount = 0;
for (const c of COMBOS) {
  for (const H of SUB_TIERS[c]) {
    for (const hal of [32, 120]) {
      for (const muka of MUKAS)
        for (const wc of WS)
          for (const wi of WS)
            for (const fin of FINS) {
              permCount++;
              const p = { ...D, ...FILE_P[c] };
              const r = calculateSoftCoverOffsetHpp({ oplah: H, jumlahHalaman: hal, mukaCover: muka, warnaCover: wc, warnaIsi: wi, finishing: fin, marginPct: 30 }, p, c);
              const e = oracle({ H, hal, combo: c, muka, wc, wi, fin, margin: 30, p });
              check(`perm ${c}@${H}/${hal} ${muka}/${wc}/${wi}/${fin} DC`, r.totalHpp, e.DC);
              check(`perm ${c}@${H}/${hal} ${muka}/${wc}/${wi}/${fin} DI`, r.hargaJualPerPcs, e.DI);
            }
    }
  }
}

// ---------- 3. REAKTIVITAS ----------
const base = (c: SoftCoverOffsetComboId, H: number, hal = 32, extra: any = {}) => calculateSoftCoverOffsetHpp(
  { oplah: H, jumlahHalaman: hal, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'None,', marginPct: 30, ...extra },
  { ...D, ...FILE_P[c] }, c);
const react = (label: string, c: SoftCoverOffsetComboId, H: number, patch: Partial<typeof D>, target: 'hpp' | 'jual' = 'hpp', extra: any = {}, hal = 32) => {
  const a = base(c, H, hal, extra);
  const b = calculateSoftCoverOffsetHpp(
    { oplah: H, jumlahHalaman: hal, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'None,', marginPct: 30, ...extra },
    { ...D, ...FILE_P[c], ...patch }, c);
  const d = target === 'hpp' ? b.totalHpp - a.totalHpp : b.hargaJualPerPcs - a.hargaJualPerPcs;
  check(`reaktif ${label} Δ>0`, d > 0 ? 1 : 0, 1);
};
const OO: SoftCoverOffsetComboId = 'Oliver-Oliver';
const PP: SoftCoverOffsetComboId = 'Print-Print';
react('umr', OO, 700, { umr: 3200000 });
react('kertasCover', OO, 700, { tarifKertasCoverKg: 18000 });
react('upCover', OO, 700, { upCoverPct: 5 });
react('gramCover', OO, 700, { gramaturCover: 260 });
react('insheetCover', OO, 700, { insheetCover: 150 });
react('desainCover', OO, 700, { tarifDesainCover: 25000 });
react('kertasIsi', OO, 700, { tarifKertasIsiKg: 17000 });
react('upIsi', OO, 700, { upIsiPct: 5 });
react('gramIsi', OO, 700, { gramaturIsi: 80 });
react('insheetIsi', OO, 700, { insheetIsi: 150 });
react('desainIsi', OO, 700, { tarifDesainIsiPerUnit: 3000 });
react('royalty', OO, 700, { tarifRoyalti: 100 });
react('kawat', OO, 700, { tarifKawatRoll: 150000 });
react('tinta', OO, 700, { tarifTintaSpotUV: 300000 }, 'hpp', { finishing: 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,' });
react('shrink', OO, 700, { tarifShrinkRoll: 900000 }, 'hpp', { finishing: 'Laminasi Glossy + Bending,' });
react('steples', PP, 100, { tarifSteplesPack: 4000 });
react('lakban', OO, 700, { tarifLakbanRoll: 10000 });
react('kardus', OO, 700, { tarifKardusBox: 10000 });
react('sisir', OO, 700, { tarifSisirPerPcs: 180 });
react('bending', OO, 700, { tarifBending: 80 }, 'hpp', { finishing: 'Lem Bending,' }, 120);
react('minBending', OO, 100, { minBending: 150000 }, 'hpp', { finishing: 'UV Varnish + Bending,' }, 120); // BZ masuk CJ, BX mentah tanpa floor
react('glossy', OO, 700, { tarifLaminasiGlossy: 0.5 }, 'hpp', { finishing: 'Laminasi Glossy,' });
react('doff', OO, 700, { tarifLaminasiDoff: 0.6 }, 'hpp', { finishing: 'Laminasi Doff,' });
react('uv', OO, 1500, { tarifUvVarnish: 0.2 }, 'hpp', { finishing: 'UV Varnish,' });
react('minFin', OO, 120, { minFinishing: 60000 }, 'hpp', { finishing: 'Laminasi Glossy,' });
{
  // margin via input (uji mandiri)
  const a30 = base(OO, 700);
  const b40 = calculateSoftCoverOffsetHpp(
    { oplah: 700, jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'None,', marginPct: 40 },
    { ...D, ...FILE_P[OO] }, OO);
  check('reaktif margin Δjual>0', b40.hargaJualPerPcs - a30.hargaJualPerPcs > 0 ? 1 : 0, 1);
}
// printA3 hanya reaktif di combo Print-* (T2*Q); F1 Oliver tak terpakai
{
  const a = base('Print-Oliver', 400);
  const b = calculateSoftCoverOffsetHpp(
    { oplah: 400, jumlahHalaman: 32, mukaCover: '1 Muka', warnaCover: '4 Warna', warnaIsi: '1 Warna', finishing: 'None,', marginPct: 30 },
    { ...D, ...FILE_P['Print-Oliver'], tarifPrintCoverA3: 3000 }, 'Print-Oliver');
  check('reaktif printA3 Δ>0', b.totalHpp - a.totalHpp > 0 ? 1 : 0, 1);
}

console.log(`\nPERMUTASI: ${permCount} kombinasi x2 assert`);
console.log(`HASIL: ${pass} PASSED, ${fail} FAILED`);
if (fails.length) { console.log('CONTOH GAGAL:'); fails.forEach((x) => console.log('  ' + x)); }
if (fail > 0) process.exit(1);
console.log('AUDIT SOFT COVER OFFSET: LULUS 100% (0 selisih)');
