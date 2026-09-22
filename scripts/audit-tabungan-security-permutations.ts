// POS 3: Benchmark Buku Tabungan Security — engine klon NS, nilai tersimpan identik.
//   Security Ryobi.xlsm (D7=1000, insheet 15/30, desain 15000, isi Ryobi, Laminasi Glossy, BJ/BL/BM=√ BQ=X, kardus √)
//   Security.xlsm (D7=100, insheet 10/10, desain 10000, isi Print Buya, Laminasi Glossy, BJ=√ BL=X BM=√ BQ=X, kardus X)
import {
  calculateBukuTabunganSecurityHpp,
  DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS,
  BukuTabunganSecuritySimulatorInput,
  TabunganSecurityFinishing,
  TABUNGAN_SECURITY_FINISHING,
} from '../src/lib/buku-tabungan-security-calculator';

let lulus = 0;
let gagal = 0;
const fail = (msg: string) => { gagal++; console.log(`  GAGAL: ${msg}`); };
const ok = (msg: string) => { lulus++; console.log(`  LULUS: ${msg}`); };
const eqRp = (a: number, b: number) => Math.round(a) === Math.round(b);

const RYOBI_DC: Record<number, number> = {
  250: 1082443.74, 300: 1167477.96, 350: 1256012.17, 400: 1341046.39, 500: 1530652.32,
  600: 1763432.41, 700: 2012225.7, 800: 2261018.99, 900: 2509812.28, 1000: 2758605.57, 1500: 4011072.02,
};
const RYOBI_DI: Record<number, number> = {
  250: 5630, 300: 5060, 350: 4670, 400: 4360, 500: 3980,
  600: 3830, 700: 3740, 800: 3680, 900: 3630, 1000: 3590, 1500: 3480,
};
const KECIL_DC: Record<number, number> = { 50: 582798.85, 100: 695258.48, 150: 811218.11, 200: 923894.1 };
const KECIL_DI: Record<number, number> = { 50: 15160, 100: 9040, 150: 7040, 200: 6010 };

const baseRyobi = (oplahPcs: number): BukuTabunganSecuritySimulatorInput => ({
  oplahPcs, jumlahHalaman: 24, mukaCover: 1, warnaCover: 4, mesinCover: 'Print Inter',
  bahanCover: 'Art Carton', gramaturCover: 260,
  warnaIsi: 1, mesinIsi: 'Ryobi', bahanIsi: 'HVS', gramaturIsi: 70,
  finishing: 'Laminasi Glossy,', jahitAktif: true, pisauPoundAktif: true, jasaPoundAktif: true,
  sisirAktif: false, kardusAktif: true, insheetCover: 15, insheetIsi: 30, marginPct: 30,
});
const ryobiParams = { ...DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS };
const kecilParams = { ...DEFAULT_BUKU_TABUNGAN_SECURITY_PARAMS, insheetCover: 10, insheetIsi: 10, tarifDesainCover: 10000 };
const baseKecil = (oplahPcs: number): BukuTabunganSecuritySimulatorInput => ({
  ...baseRyobi(oplahPcs), mesinIsi: 'Print Buya', pisauPoundAktif: false, kardusAktif: false,
  insheetCover: 10, insheetIsi: 10,
});

console.log('== Snapshot komponen ROW16 Security-Ryobi (oplah 1000) ==');
{
  const r = calculateBukuTabunganSecurityHpp(baseRyobi(1000), ryobiParams);
  const exp: Record<string, number> = {
    'Kertas Cover': 927500, 'Desain Cover': 15000, 'Plate Cover': 0, 'Ongkos Cetak Cover': 0,
    'Kertas Isi': 240939.81, 'Desain Isi': 9000, 'Plate Isi': 60000, 'Ongkos Cetak Isi': 185400,
    'Jasa Susun + Lipat': 125270.44, 'Jasa Jahit': 450973.6, 'Pisau Pound': 52377.5,
    'Jasa Pound': 250540.89, 'Pound Gabungan (BN7)': 302918.39, 'Laminasi Glossy': 121275,
    'Kardus + Lakban': 17409.93,
  };
  for (const b of r.breakdown) {
    if (b.diLuarTotal) continue;
    if (exp[b.nama] !== undefined && !eqRp(b.nominal, exp[b.nama])) fail(`${b.nama}: sintak=${b.nominal} excel=${exp[b.nama]}`);
  }
  if (!eqRp(r.totalHpp, 2758605.57)) fail(`totalHpp ${r.totalHpp}`);
  if (r.hargaFinalPerPcs !== 3590) fail(`final ${r.hargaFinalPerPcs}`);
  if (r.kebutuhanCoverPlano !== 265) fail(`R7 ${r.kebutuhanCoverPlano}`);
  if (r.kebutuhanIsiPlano !== 3090) fail(`AP7 ${r.kebutuhanIsiPlano}`);
  ok('snapshot ROW16 Security-Ryobi 16 komponen + R7/AP7/DC/DI = 0 selisih');
}

console.log('== Snapshot ROW8 Security-Kecil (oplah 100) ==');
{
  const r = calculateBukuTabunganSecurityHpp(baseKecil(100), kecilParams);
  if (!eqRp(r.totalHpp, 695258.48)) fail(`totalHpp ${r.totalHpp}`);
  if (r.hargaFinalPerPcs !== 9040) fail(`final ${r.hargaFinalPerPcs}`);
  const bd = Object.fromEntries(r.breakdown.map((b) => [b.nama, b.nominal]));
  if (!eqRp(bd['Kertas Cover'], 122500)) fail(`kertas cover ${bd['Kertas Cover']}`);
  if (!eqRp(bd['Ongkos Cetak Isi'], 115500)) fail(`cetak isi Buya ${bd['Ongkos Cetak Isi']}`);
  if (!eqRp(bd['Jasa Jahit'], 250000)) fail(`jahit min ${bd['Jasa Jahit']}`);
  if (!eqRp(bd['Laminasi Glossy'], 50000)) fail(`lam min ${bd['Laminasi Glossy']}`);
  if (!eqRp(bd['Kardus + Lakban'] ?? 0, 0)) fail('kardus harus 0 (DA28=X)');
  ok('snapshot ROW8 Security-Kecil DC/DI + 5 komponen kunci = 0 selisih');
}

console.log('== Sweep 11 tier Ryobi + 4 tier Kecil (DC & DI) ==');
for (const [pcs, dc] of Object.entries(RYOBI_DC)) {
  const r = calculateBukuTabunganSecurityHpp(baseRyobi(Number(pcs)), ryobiParams);
  if (!eqRp(r.totalHpp, dc)) fail(`Ryobi tier ${pcs}: DC sintak=${Math.round(r.totalHpp)} excel=${dc}`);
  else if (r.hargaFinalPerPcs !== RYOBI_DI[Number(pcs)]) fail(`Ryobi tier ${pcs}: DI sintak=${r.hargaFinalPerPcs} excel=${RYOBI_DI[Number(pcs)]}`);
  else ok(`Ryobi tier ${pcs}: DC=${Math.round(r.totalHpp)} DI=${r.hargaFinalPerPcs} (0 selisih)`);
}
for (const [pcs, dc] of Object.entries(KECIL_DC)) {
  const r = calculateBukuTabunganSecurityHpp(baseKecil(Number(pcs)), kecilParams);
  if (!eqRp(r.totalHpp, dc)) fail(`Kecil tier ${pcs}: DC sintak=${Math.round(r.totalHpp)} excel=${dc}`);
  else if (r.hargaFinalPerPcs !== KECIL_DI[Number(pcs)]) fail(`Kecil tier ${pcs}: DI sintak=${r.hargaFinalPerPcs} excel=${KECIL_DI[Number(pcs)]}`);
  else ok(`Kecil tier ${pcs}: DC=${Math.round(r.totalHpp)} DI=${r.hargaFinalPerPcs} (0 selisih)`);
}

console.log('== Permutasi mesin cover x isi x finishing (konsistensi internal) ==');
{
  let n = 0;
  for (const mc of ['Print Inter', 'Ryobi', 'Oliver', 'SM'] as const) {
    for (const mi of ['Print Buya', 'Print Inter', 'Ryobi', 'Oliver', 'SM'] as const) {
      for (const fin of TABUNGAN_SECURITY_FINISHING) {
        for (const pcs of [100, 1000]) {
          const inp = { ...baseRyobi(pcs), mesinCover: mc, mesinIsi: mi, finishing: fin as TabunganSecurityFinishing };
          const r = calculateBukuTabunganSecurityHpp(inp, ryobiParams);
          n++;
          const sum = r.breakdown.filter((b) => !b.diLuarTotal).reduce((s, b) => s + b.nominal, 0);
          if (Math.round(sum) !== Math.round(r.totalHpp)) { fail(`${mc}x${mi} ${fin} pcs=${pcs}: sum breakdown != DC7`); continue; }
          if (r.hargaFinalPerPcs !== (r.totalHpp > 0 ? Math.ceil((r.totalHpp / pcs) * 1.3 / 10) * 10 : 0)) { fail(`${mc}x${mi} ${fin} pcs=${pcs}: aturan ROUNDUP puluhan`); continue; }
          if (!Number.isFinite(r.totalHpp) || r.totalHpp < 0) { fail(`${mc}x${mi} ${fin} pcs=${pcs}: HPP invalid`); continue; }
        }
      }
    }
  }
  ok(`${n} permutasi (4 cover x 5 isi x 9 finishing x 2 tier) konsisten: sum=DC7, ROUNDUP puluhan, finite`);
}

console.log('== Reaktivitas parameter (Delta HPP > 0) ==');
{
  const base = calculateBukuTabunganSecurityHpp(baseRyobi(1000), ryobiParams).totalHpp;
  const filmWarna = (p: typeof ryobiParams) =>
    calculateBukuTabunganSecurityHpp(baseRyobi(1000), p).breakdown.find((b) => b.nama.startsWith('Film Warna'))?.nominal ?? 0;
  const tests: [string, number][] = [
    ['insheetCover 15->300', calculateBukuTabunganSecurityHpp({ ...baseRyobi(1000), insheetCover: 300 }, ryobiParams).totalHpp - base],
    ['insheetIsi 30->300', calculateBukuTabunganSecurityHpp({ ...baseRyobi(1000), insheetIsi: 300 }, ryobiParams).totalHpp - base],
    ['tarifDesainCover param', calculateBukuTabunganSecurityHpp(baseRyobi(1000), { ...ryobiParams, tarifDesainCover: 15000 + 5000 }).totalHpp - base],
    ['tarifKertasCoverKg param (cover Ryobi)', calculateBukuTabunganSecurityHpp({ ...baseRyobi(1000), mesinCover: 'Ryobi' }, { ...ryobiParams, tarifKertasCoverKg: 16400 + 1000 }).totalHpp
      - calculateBukuTabunganSecurityHpp({ ...baseRyobi(1000), mesinCover: 'Ryobi' }, ryobiParams).totalHpp],
    ['tarifKertasIsiKg param', calculateBukuTabunganSecurityHpp(baseRyobi(1000), { ...ryobiParams, tarifKertasIsiKg: 15700 + 1000 }).totalHpp - base],
    ['umr param', calculateBukuTabunganSecurityHpp(baseRyobi(1000), { ...ryobiParams, umr: 2818585 + 250000 }).totalHpp - base],
    ['jahitAktif √->X @1000', base - calculateBukuTabunganSecurityHpp({ ...baseRyobi(1000), jahitAktif: false }, ryobiParams).totalHpp],
    ['pisauPound √->X', base - calculateBukuTabunganSecurityHpp({ ...baseRyobi(1000), pisauPoundAktif: false }, ryobiParams).totalHpp],
    ['sisir X->√', calculateBukuTabunganSecurityHpp({ ...baseRyobi(1000), sisirAktif: true }, ryobiParams).totalHpp - base],
    ['kardus √->X', base - calculateBukuTabunganSecurityHpp({ ...baseRyobi(1000), kardusAktif: false }, ryobiParams).totalHpp],
    ['tarifFilmWarna 0->100 (info AU7)', filmWarna({ ...ryobiParams, tarifFilmWarna: 100 }) - filmWarna(ryobiParams)],
    ['margin 30->35 (totalHarga)', calculateBukuTabunganSecurityHpp({ ...baseRyobi(1000), marginPct: 35 }, ryobiParams).totalHarga
      - calculateBukuTabunganSecurityHpp(baseRyobi(1000), ryobiParams).totalHarga],
  ];
  for (const [nama, delta] of tests) {
    if (delta > 0) ok(`${nama}: Δ=${Math.round(delta).toLocaleString('id-ID')}`);
    else fail(`${nama}: Δ=${delta} (tidak reaktif!)`);
  }
}

console.log('========================================================================================');
console.log(`HASIL AKHIR BENCHMARK: ${lulus} LULUS, ${gagal} GAGAL`);
console.log('========================================================================================');
if (gagal > 0) process.exit(1);
