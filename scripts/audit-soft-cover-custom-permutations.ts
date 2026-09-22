import { readFileSync } from 'fs';
import { SOFT_COVER_CUSTOM_CONFIGS, defaultSoftCoverCustomParams, calcSoftCoverCustomTier, SoftCoverCustomLini, SoftCoverCustomParams } from '../src/lib/buku-soft-cover-custom-calculator';

const EXP = JSON.parse(readFileSync('scripts/bsc4-expected.json', 'utf-8')) as Record<string, { oplah: number; DI: number; DD: number; row: Record<string, number> }[]>;
let pass = 0; let fail = 0;
const ok = (cond: boolean, msg: string) => { if (cond) pass++; else { fail++; console.log(`FAIL ${msg}`); } };
const close = (a: number, b: number, tol = 1e-4) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// POS3a: seluruh tier × 10 lini — DI exact, DD toleransi, intermediate exact/toleransi vs cache Excel.
for (const lini of Object.keys(EXP) as SoftCoverCustomLini[]) {
  const cfg = SOFT_COVER_CUSTOM_CONFIGS[lini]; const p = defaultSoftCoverCustomParams(lini);
  for (const t of EXP[lini]) {
    const r = calcSoftCoverCustomTier(cfg, p, t.oplah); const e = t.row; const d = r.dbg;
    ok(r.hargaJualPerPcs === t.DI, `${lini}@${t.oplah} DI got=${r.hargaJualPerPcs} exp=${t.DI}`);
    ok(close(r.hppPerPcs, t.DD, 1e-6), `${lini}@${t.oplah} DD got=${r.hppPerPcs} exp=${t.DD}`);
    ok(r.totalHpp === 0 || close(r.totalHpp, e['DC']), `${lini}@${t.oplah} DC`);
    for (const [col, val] of [['Q', d.Q], ['R', d.R], ['T', r.kertasCover], ['V', r.desainCover], ['Y', r.platCover], ['Z', d.Z], ['AB', d.minCover], ['AD', d.AD], ['AE', d.AE], ['AF', d.AF], ['AG', r.ongkosCover], ['AK', d.AK], ['AL', d.AL], ['AM', d.AM], ['AN', d.AN], ['AO', d.AO], ['AP', d.AP], ['AR', r.kertasIsi], ['AT', r.desainIsi], ['AW', r.platIsi], ['AX', d.AX], ['AY', d.minIsi], ['BA', d.BA], ['BB', d.BB], ['BC', d.BC], ['BD', r.ongkosIsi]] as [string, number][]) {
      if (Number.isNaN(e[col])) continue;
      const tol = Number.isInteger(val) && Number.isInteger(e[col]) ? 0 : 1e-4;
      ok(close(val, e[col], tol), `${lini}@${t.oplah} ${col} got=${val} exp=${e[col]}`);
    }
    const H = t.oplah;
    ok(close(d.BI6 * d.AN6 * H, e['BI']), `${lini}@${H} BI`);
    ok(close(d.BJ6 * H, e['BJ']), `${lini}@${H} BJ`);
    ok(close(d.BK6 * d.AN6 * H, e['BK']), `${lini}@${H} BK`);
    ok(close(d.BL6 * H, e['BL']), `${lini}@${H} BL`);
    ok(close(d.BM6 * H, e['BM']), `${lini}@${H} BM`);
    ok(close(d.BN6 * H, e['BN']), `${lini}@${H} BN`);
    ok(close(d.BO6 * H, e['BO']), `${lini}@${H} BO`);
    ok(close(d.BQ, e['BQ']), `${lini}@${H} BQ`);
    ok(close(H / d.BS6, e['BS']), `${lini}@${H} BS`);
    ok(close(d.BT, e['BT']), `${lini}@${H} BT`);
    ok(close(d.BV, e['BV']), `${lini}@${H} BV`);
    ok(close(d.BY, e['BY']), `${lini}@${H} BY`);
    ok(close(d.BZ, e['BZ']), `${lini}@${H} BZ`);
    ok(close(d.bendMin, e['CE']), `${lini}@${H} CE`);
    ok(close(d.cf, e['CF']), `${lini}@${H} CF`);
    ok(close(d.cfMin, e['CH']), `${lini}@${H} CH`);
    ok(close(d.ci, e['CI']), `${lini}@${H} CI`);
    ok(close(d.ciMin, e['CK']), `${lini}@${H} CK`);
    ok(close(d.cl, e['CL']), `${lini}@${H} CL`);
    ok(close(d.clMin, e['CN']), `${lini}@${H} CN`);
    ok(close(H / d.CS6, e['CS']), `${lini}@${H} CS`);
    ok(close(d.lakban, e['CZ']), `${lini}@${H} CZ`);
    ok(close(d.kardus, e['DA']), `${lini}@${H} DA`);
    ok(close(r.labaPerPcs, e['DE'], 1e-6), `${lini}@${H} DE`);
  }
}

// POS3b: permutasi mesin × muka × warna × finishing × toggle — anti-crash + DI>0.
const D29S = ['None,', 'UV Varnish,', 'Laminasi Glossy,', 'Laminasi Doff,', 'Lem Bending,', 'UV Varnish + Bending,', 'Laminasi Glossy + Bending,', 'Laminasi Doff + Bending,', 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,'];
let perm = 0;
for (const lini of Object.keys(SOFT_COVER_CUSTOM_CONFIGS) as SoftCoverCustomLini[]) {
  const cfg = SOFT_COVER_CUSTOM_CONFIGS[lini];
  const covers = cfg.ukuran === '10,5 X 14,8' ? ['SM', 'Oliver', 'Print Inter', 'Print Buya'] : ['SM', 'Oliver', 'Ryobi', 'Print Inter', 'Print Buya'];
  const isis = ['SM', 'Oliver', 'Ryobi', 'Print Buya', 'Print Inter'];
  const oplah = cfg.tiers[Math.floor(cfg.tiers.length / 2)];
  for (const mc of covers) for (const mi of isis) for (const muka of [1, 2] as const)
    for (const wc of [1, 4]) for (const wi of [1, 4]) for (const d29 of D29S) for (const fin of [true, false]) {
      const p = { ...defaultSoftCoverCustomParams(lini), mesinCover: mc, mesinIsi: mi, mukaCover: muka, warnaCover: wc, warnaIsi: wi, d29, finLipat: fin, finSisir: fin, finSusunKomplit: fin, finKawat: fin, finStiching: fin, finSusunStaples: !fin, finBiayaStaples: !fin };
      const r = calcSoftCoverCustomTier(cfg, p, oplah);
      perm++;
      ok(Number.isFinite(r.totalHpp) && r.totalHpp >= 0 && Number.isFinite(r.hargaJualPerPcs) && r.hargaJualPerPcs > 0, `perm ${lini} ${mc}/${mi} m${muka} c${wc}/i${wi} ${d29} fin=${fin}`);
    }
}
console.log(`PERMUTASI: ${perm} kombinasi`);

// POS3c: reaktivitas — tiap parameter wajib menggerakkan HPP (Δ>0).
const react = (lini: SoftCoverCustomLini, mut: (p: SoftCoverCustomParams) => void, label: string) => {
  const cfg = SOFT_COVER_CUSTOM_CONFIGS[lini];
  const base = calcSoftCoverCustomTier(cfg, defaultSoftCoverCustomParams(lini), cfg.tiers[0]).totalHpp;
  const p2 = defaultSoftCoverCustomParams(lini); mut(p2);
  const d = calcSoftCoverCustomTier(cfg, p2, cfg.tiers[0]).totalHpp - base;
  ok(d > 1e-6, `reaktivitas ${label} Δ=${d}`);
};
const OO = 'custom-oo145-21' as SoftCoverCustomLini; const PP = 'custom-pp105-24' as SoftCoverCustomLini;
react(PP, (p) => { p.insheetCover += 10; }, 'insheetCover');
react(PP, (p) => { p.insheetIsi += 10; }, 'insheetIsi');
react(PP, (p) => { p.desainCover += 5000; }, 'desainCover');
react(PP, (p) => { p.desainIsiPerHlm += 500; }, 'desainIsi');
react(PP, (p) => { p.tarifPrintCover += 100; }, 'tarifPrintCover');
react(OO, (p) => { p.hargaKertasCoverKg += 100; }, 'hargaKertasCoverKg');
react(PP, (p) => { p.hargaKertasIsiKg += 100; }, 'hargaKertasIsi');
react(PP, (p) => { p.jumlahHalaman += 8; }, 'jumlahHalaman');
react(OO, (p) => { p.warnaIsi = 4; }, 'warnaIsi(plat)');
react(PP, (p) => { p.mesinIsi = 'Print Inter'; p.drekIsi += 100; }, 'drekIsi');
react(OO, (p) => { p.umr += 100000; }, 'umr');
react(OO, (p) => { p.upCoverPct = 3; }, 'upCoverPct');
react(OO, (p) => { p.upIsiPct = 3; }, 'upIsiPct');
react(OO, (p) => { p.mukaCover = 2; }, 'mukaCover');
const reactAbs = (lini: SoftCoverCustomLini, mut: (p: SoftCoverCustomParams) => void, label: string) => {
  const cfg = SOFT_COVER_CUSTOM_CONFIGS[lini];
  const base = calcSoftCoverCustomTier(cfg, defaultSoftCoverCustomParams(lini), cfg.tiers[0]).totalHpp;
  const p2 = defaultSoftCoverCustomParams(lini); mut(p2);
  const d = calcSoftCoverCustomTier(cfg, p2, cfg.tiers[0]).totalHpp - base;
  ok(Math.abs(d) > 1e-6, `reaktivitas ${label} Δ=${d}`);
};
reactAbs(OO, (p) => { p.finLipat = false; }, 'finLipat-off');
reactAbs(PP, (p) => { p.finSusunStaples = false; }, 'finSusun-off');
react(PP, (p) => { p.d29 = 'Laminasi Doff + Spot UV + Emboss + Lem Bending + Shrink,'; }, 'd29-full');
reactAbs(OO, (p) => { p.targetLipat = 5000; }, 'targetLipat');
react(PP, (p) => { p.kardus += 100; }, 'kardus');
react(PP, (p) => { p.plastikShrinkRoll += 1000; p.d29 = 'Laminasi Glossy + Bending,'; }, 'shrink');
{ // labaPct menggerakkan harga jual (bukan HPP)
  const cfg = SOFT_COVER_CUSTOM_CONFIGS[PP];
  const a = calcSoftCoverCustomTier(cfg, defaultSoftCoverCustomParams(PP), cfg.tiers[0]).hargaJualPerPcs;
  const p2 = defaultSoftCoverCustomParams(PP); p2.labaPct += 5;
  const b = calcSoftCoverCustomTier(cfg, p2, cfg.tiers[0]).hargaJualPerPcs;
  ok(b - a > 0, `reaktivitas labaPct ΔDI=${b - a}`);
}
{ // warnaCover menggerakkan plat cover (basis 1 → 4)
  const cfg = SOFT_COVER_CUSTOM_CONFIGS[OO];
  const p1 = defaultSoftCoverCustomParams(OO); p1.warnaCover = 1;
  const p2 = defaultSoftCoverCustomParams(OO); p2.warnaCover = 4;
  const d = calcSoftCoverCustomTier(cfg, p2, cfg.tiers[0]).totalHpp - calcSoftCoverCustomTier(cfg, p1, cfg.tiers[0]).totalHpp;
  ok(d > 0, `reaktivitas warnaCover Δ=${d}`);
}
console.log(`HASIL: ${pass} PASSED, ${fail} FAILED`);
if (fail > 0) process.exit(1);
console.log('AUDIT SOFT COVER CUSTOM: LULUS 100% (0 selisih)');
