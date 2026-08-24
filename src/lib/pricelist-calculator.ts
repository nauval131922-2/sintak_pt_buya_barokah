// ponytail: kalkulasi dinamis untuk seluruh matriks pricelist saat master parameter berubah

import {
  calculatePricelistSimulator,
  SimulatorMasterParams,
} from './pricelist-simulator';

export interface PricelistItem {
  id: number;
  jenis_kalender: string;
  oplah: number;
  proses: string;
  bahan: string;
  ukuran: string;
  finishing_jilid?: 'Spiral' | 'Klem';
  hpp: number;
  harga: number;
  harga_nego: number;
  profit_pct: number;
  profit_pct_nego: number;
  profit_tot: number;
  profit_tot_nego: number;
}

const BLOCKS = [
  { name: 'Eko Wulan (12 Lbr)', oplahs: [500, 1000, 1500, 2000, 3000, 5000] },
  { name: 'Dwi Wulan (6 Lbr)', oplahs: [500, 1000, 1500, 2000, 3000, 5000] },
  { name: 'Tri Wulan (4 Lbr)', oplahs: [500, 1000, 1500, 2000, 3000, 5000] },
];

const MATERIALS = ['HVS 70', 'ART PAPER 120', 'ART PAPER 150'];
const SIZES = ['32 x 48', '38 x 54', '46 x 64', '48 x 64'];

/**
 * Menghitung ulang seluruh 216 kombinasi Pricelist Kalender secara instan.
 */
export function recalculatePricelistFromParams(
  customParams: SimulatorMasterParams,
  baseItems: PricelistItem[],
  finishingJilid: 'Spiral' | 'Klem' = 'Spiral'
): PricelistItem[] {
  // Pre-calculate konstanta dan harga plano untuk 3 bahan & 4 ukuran agar O(1) di loop
  const p = customParams;
  const ppn = p.ppnMarginKertas ?? 1.05;
  const rimConst = p.konstantaBeratRim || 20000;
  const lbrPerRim = p.lembarPerRim || 500;

  // Cache perhitungan plano, colator, & klem per ukuran
  const sizeMeta: Record<
    string,
    { planoL: number; planoP: number; potong: number; colator: number; klem: number }
  > = {
    '32 x 48': {
      planoL: 65,
      planoP: 100,
      potong: p.potong32x48 ?? 4,
      colator: p.colator32x48 ?? 40,
      klem: p.klem32x48 ?? 350,
    },
    '38 x 54': {
      planoL: 79,
      planoP: 109,
      potong: p.potong38x54 ?? 4,
      colator: p.colator38x54 ?? 55,
      klem: p.klem38x54 ?? 350,
    },
    '46 x 64': {
      planoL: 65,
      planoP: 100,
      potong: p.potong46x64 ?? 2,
      colator: p.colator46x64 ?? 70,
      klem: p.klem46x64 ?? 480,
    },
    '48 x 64': {
      planoL: 65,
      planoP: 100,
      potong: p.potong48x64 ?? 2,
      colator: p.colator48x64 ?? 75,
      klem: p.klem48x64 ?? 490,
    },
  };

  const matMeta: Record<string, { gsm: number; tarif: number; ppn: number }> = {
    'HVS 70': { gsm: 70, tarif: p.tarifHvs70 ?? 15700, ppn: p.ppnHvs70 ?? 1.05 },
    'ART PAPER 120': { gsm: 120, tarif: p.tarifAp120 ?? 17400, ppn: p.ppnAp120 ?? 1.05 },
    'ART PAPER 150': { gsm: 150, tarif: p.tarifAp150 ?? 17400, ppn: p.ppnAp150 ?? 1.05 },
  };

  const calcRow = (
    jenis_kalender: string,
    bahan: string,
    ukuran: string,
    oplah: number,
    proses: string
  ) => {
    let lembar = 12;
    if (jenis_kalender.includes('Dwi')) lembar = 6;
    else if (jenis_kalender.includes('Tri')) lembar = 4;

    const s = sizeMeta[ukuran] || sizeMeta['32 x 48'];
    const m = matMeta[bahan] || matMeta['ART PAPER 150'];
    const isOliver = proses !== 'SM';

    const insheet = isOliver ? p.oliverInsheet : p.smInsheet;
    const biayaPlatUnit = isOliver ? p.oliverPlatUnit : p.smPlatUnit;
    const ongkosCetakDasar = isOliver ? p.oliverMinOngkos : p.smMinOngkos;
    const tarifDrekOver = isOliver ? p.oliverDrekOver : p.smDrekOver;
    const biayaTransport = isOliver ? p.oliverTransport : p.smTransport;
    const batasDrek = isOliver ? p.oliverBatasDrek : p.smBatasDrek;

    const areaCetak = isOliver ? (ukuran === '32 x 48' ? 2 : 1) : (ukuran === '32 x 48' ? 4 : 2);

    // 1. Kertas
    const beratRimKg = (s.planoL * s.planoP * m.gsm) / rimConst;
    const hargaPerPlano = (beratRimKg * (m.tarif * m.ppn)) / lbrPerRim;
    const totalPlano = ((oplah + insheet) * lembar) / s.potong;
    const biayaKertas = hargaPerPlano * totalPlano;

    // 2. Plat
    const jmlPlat = Math.ceil(lembar / areaCetak) * 4;
    const biayaPlat = jmlPlat * biayaPlatUnit;

    // 3. Mesin
    const drekOver = Math.max(0, oplah + insheet - batasDrek);
    const ongkosCetakMesin = jmlPlat * ongkosCetakDasar + drekOver * tarifDrekOver * jmlPlat;

    // 4-11
    const biayaDesain = p.tarifDesain * lembar;
    const biayaAlmanak = p.tarifAlmanakDesain + biayaPlatUnit + ongkosCetakDasar + drekOver * tarifDrekOver;
    const biayaRoyalty = p.tarifRoyalty * oplah;
    const biayaPotong =
      p.tarifPotongDasar * lembar +
      p.tarifPotongDasar * (lembar / (ukuran === '32 x 48' ? 4 : 2));
    const biayaColator = lembar * s.colator * (oplah + insheet / 2);

    // Jilid: Spiral vs Klem
    const isKlem = finishingJilid === 'Klem';
    const lebarCm = parseFloat(ukuran.split('x')[0]) || 32;
    const biayaSpiral = isKlem ? 0 : Math.max(p.tarifSpiralMin, lebarCm * p.tarifSpiralLubang * (oplah + 5));
    const biayaKlem = isKlem ? (oplah + 5) * s.klem : 0;
    const biayaJilid = isKlem ? biayaKlem : biayaSpiral;

    const biayaLakban = Math.max(p.tarifLakbanRoll, (oplah / 50 / (p.kapasitasLakbanRoll || 133.33)) * p.tarifLakbanRoll);

    const totalBiayaProduksi =
      biayaKertas +
      biayaPlat +
      ongkosCetakMesin +
      biayaDesain +
      biayaAlmanak +
      biayaRoyalty +
      biayaPotong +
      biayaColator +
      biayaJilid +
      biayaLakban +
      biayaTransport;

    const hpp = totalBiayaProduksi / oplah;
    const harga = Math.ceil((hpp * 1.30) / 100) * 100;
    const harga_nego = Math.ceil((harga * 0.96) / 100) * 100;
    const profit_tot = (harga - hpp) * oplah;
    const profit_tot_nego = (harga_nego - hpp) * oplah;
    const profit_pct = hpp > 0 ? (harga - hpp) / hpp : 0;
    const profit_pct_nego = hpp > 0 ? (harga_nego - hpp) / hpp : 0;

    return {
      hpp,
      harga,
      harga_nego,
      profit_pct,
      profit_pct_nego,
      profit_tot,
      profit_tot_nego,
    };
  };

  if (baseItems && baseItems.length > 0) {
    return baseItems.map((item) => {
      const calc = calcRow(item.jenis_kalender, item.bahan, item.ukuran, item.oplah, item.proses);
      return {
        ...item,
        finishing_jilid: finishingJilid,
        ...calc,
      };
    });
  }

  let idCounter = 1;
  const items: PricelistItem[] = [];
  for (const block of BLOCKS) {
    for (const oplah of block.oplahs) {
      const proses = oplah >= 3000 ? 'SM' : 'Oliver';
      for (const bahan of MATERIALS) {
        for (const ukuran of SIZES) {
          const calc = calcRow(block.name, bahan, ukuran, oplah, proses);
          items.push({
            id: idCounter++,
            jenis_kalender: block.name,
            oplah,
            proses,
            bahan,
            ukuran,
            finishing_jilid: finishingJilid,
            ...calc,
          });
        }
      }
    }
  }

  return items;
}
