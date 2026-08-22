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
 * Menghitung ulang seluruh 216 kombinasi Pricelist Kalender secara real-time
 * berdasarkan Master Parameter yang sedang aktif.
 */
export function recalculatePricelistFromParams(
  customParams: SimulatorMasterParams,
  baseItems: PricelistItem[]
): PricelistItem[] {
  // Jika baseItems sudah ada dari database/upload, kita update nilai hpp, harga, profit-nya secara reaktif
  if (baseItems && baseItems.length > 0) {
    return baseItems.map((item) => {
      const calc = calculatePricelistSimulator({
        modelKalender: item.jenis_kalender,
        bahan: item.bahan,
        ukuran: item.ukuran,
        oplah: item.oplah,
        pilihanMesin: (item.proses === 'SM' ? 'SM' : 'Oliver') as 'SM' | 'Oliver',
        marginPct: 0.30,
        negoDiskonPct: 0.04,
        customParams,
      });

      const hpp = calc.summary.hppPerPcs;
      const harga = calc.summary.hargaJualPerPcs;
      const harga_nego = calc.summary.hargaNegoPerPcs;
      const profit_tot = calc.summary.estimasiProfit;
      const profit_tot_nego = calc.summary.estimasiProfitNego;
      const profit_pct = hpp > 0 ? (harga - hpp) / hpp : 0;
      const profit_pct_nego = hpp > 0 ? (harga_nego - hpp) / hpp : 0;

      return {
        ...item,
        hpp,
        harga,
        harga_nego,
        profit_pct,
        profit_pct_nego,
        profit_tot,
        profit_tot_nego,
      };
    });
  }

  // Jika belum ada data dari upload sama sekali, generate langsung 216 kombinasi standar
  let idCounter = 1;
  const items: PricelistItem[] = [];

  for (const block of BLOCKS) {
    for (const oplah of block.oplahs) {
      const proses = oplah >= 3000 ? 'SM' : 'Oliver';
      for (const bahan of MATERIALS) {
        for (const ukuran of SIZES) {
          const calc = calculatePricelistSimulator({
            modelKalender: block.name,
            bahan,
            ukuran,
            oplah,
            pilihanMesin: proses as 'SM' | 'Oliver',
            marginPct: 0.30,
            negoDiskonPct: 0.04,
            customParams,
          });

          const hpp = calc.summary.hppPerPcs;
          const harga = calc.summary.hargaJualPerPcs;
          const harga_nego = calc.summary.hargaNegoPerPcs;
          const profit_tot = calc.summary.estimasiProfit;
          const profit_tot_nego = calc.summary.estimasiProfitNego;
          const profit_pct = hpp > 0 ? (harga - hpp) / hpp : 0;
          const profit_pct_nego = hpp > 0 ? (harga_nego - hpp) / hpp : 0;

          items.push({
            id: idCounter++,
            jenis_kalender: block.name,
            oplah,
            proses,
            bahan,
            ukuran,
            hpp,
            harga,
            harga_nego,
            profit_pct,
            profit_pct_nego,
            profit_tot,
            profit_tot_nego,
          });
        }
      }
    }
  }

  return items;
}
