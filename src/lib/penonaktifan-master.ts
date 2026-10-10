// penonaktifan-master.ts — Klasifikasi 4 pilar Lap. Penonaktifan Master Barang Jadi.
// Cakupan: kd_golongan = 'Barang Jadi Pesanan', saldo 0, status Aktif (checked).
// Pilar 2 = filter pelindung: DILARANG tutup walau saldo 0.
// Produk rutin ditentukan via settings (keyword + kode eksplisit), bukan regex hardcode.

export const GOLONGAN_BJP = 'Barang Jadi Pesanan';

// ponytail: strip tag HTML Digit (mis. faktur_prd BOM "<i class=...> PR001...").
export function stripHtmlTags(v: unknown): string {
  return String(v ?? '').replace(/<[^>]*>/g, '').trim();
}

export function extractFakturPrd(v: unknown): string {
  const clean = stripHtmlTags(v);
  const m = clean.match(/PR\d+/i);
  return (m ? m[0] : clean).trim().toUpperCase();
}

// checked = Aktif, unchecked = Nonaktif (input bo.mbrg.status di Digit).
export function isMasterAktif(statusHtml: unknown): boolean {
  return String(statusHtml ?? '').includes('checked');
}

// 'dd-mm-yyyy' -> 'yyyy-mm-dd' (atau '' bila tak valid). Terima 'd-m-yyyy' juga.
export function ddMmYyyyToIso(tgl: unknown): string {
  const s = String(tgl ?? '').trim().split('T')[0].split(' ')[0];
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) return '';
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// 'yyyy-mm-dd' -> 'dd/mm/yyyy' untuk alasan. Terima 'yyyy-mm-dd HH:MM:SS' juga.
export function isoToSlash(tglIso: string): string {
  const s = String(tglIso ?? '').trim().slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

export interface OutflowBukti {
  jenis: 'PJ' | 'SM' | 'SV';
  faktur: string;
  tgl: string; // yyyy-mm-dd (dari kolom tgl usr_log)
}

export interface KlasifikasiInput {
  kode: string;
  totPR: number; // oplah SPK s.d. cutoff
  totPD: number; // realisasi hasil s.d. cutoff
  lastSelesai: number | null; // flag penyerahan terakhir (0 = masih jalan)
  lastWipAkhir: number | null;
  hasPostCutoffPD: boolean; // ada setoran PD setelah cutoff
  hasPostCutoffPR: boolean; // ada SPK/order susulan setelah cutoff
  isRoutine: boolean; // dari settings (keyword/kode)
  outflows: OutflowBukti[]; // PJ/SM/SV s.d. cutoff (dari usr_log)
  lastHuluIso: string; // tgl hulu terakhir (BOM/QO/SO) atau ''
  idleDays: number; // batas idle kategori B (default 7)
  cutoffIso: string;
}

export type KategoriNonaktif = 'A_LUDES' | 'B_BATAL';

export interface KlasifikasiResult {
  boleh: boolean;
  larangan: string[];
  kategori: KategoriNonaktif | null;
  alasan: string;
}

function fmtNum(n: number): string {
  return Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

// Selisih hari cutoff - tgl (tgl <= cutoff). -1 bila tak valid.
function ageDays(cutoffIso: string, tglIso: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoffIso) || !/^\d{4}-\d{2}-\d{2}$/.test(tglIso)) return -1;
  const ms = Date.parse(`${cutoffIso}T12:00:00Z`) - Date.parse(`${tglIso}T12:00:00Z`);
  return Math.floor(ms / 86400000);
}

// Klasifikasi murni (tanpa I/O): Pilar 2 dulu, baru tentukan kategori + alasan.
export function klasifikasiItem(inp: KlasifikasiInput): KlasifikasiResult {
  const larangan: string[] = [];
  const totPR = Number(inp.totPR || 0);
  const totPD = Number(inp.totPD || 0);

  if (inp.isRoutine) {
    larangan.push('Produk rutin (daftar pengaturan)');
  }
  if (totPR > 0 && totPD < totPR) {
    larangan.push(`Oplah belum tuntas (PR=${fmtNum(totPR)}, PD=${fmtNum(totPD)})`);
  }
  if (totPR > 0 && inp.lastSelesai === 0) {
    larangan.push('WIP masih berjalan (selesai=0)');
  }
  if (inp.lastWipAkhir != null && Number(inp.lastWipAkhir) > 0) {
     larangan.push(`Sisa WIP ${fmtNum(Number(inp.lastWipAkhir))}`);
   }
  if (inp.hasPostCutoffPD) {
     larangan.push('Ada setoran hasil produksi lanjutan pasca-cutoff');
   }
  if (inp.hasPostCutoffPR) {
     larangan.push('Ada SPK/order susulan pasca-cutoff');
   }

  if (larangan.length > 0) {
    return { boleh: false, larangan, kategori: null, alasan: larangan.join('; ') };
  }

  if (totPR > 0) {
    // Kategori A: SPK tuntas WAJIB ada bukti outflow (PJ/SM/SV).
    if (inp.outflows.length === 0) {
      return { boleh: false, larangan: ['SPK tuntas tapi belum ada bukti keluar (PJ/SM/SV)'], kategori: null, alasan: 'SPK tuntas tapi belum ada bukti keluar (PJ/SM/SV)' };
    }
    const bukti = [...inp.outflows].sort((a, b) => (a.tgl < b.tgl ? -1 : 1)).at(-1) ?? inp.outflows[0];
    return {
      boleh: true,
      larangan,
      kategori: 'A_LUDES',
      alasan: `Ludes via ${bukti.jenis} ${bukti.faktur} tgl ${isoToSlash(bukti.tgl)} (PR=${fmtNum(totPR)}, PD=${fmtNum(totPD)}, saldo 0.00)`,
    };
  }

  // Kategori B: tanpa PR WAJIB idle >= idleDays sejak hulu terakhir.
  const umur = ageDays(inp.cutoffIso, inp.lastHuluIso);
  if (inp.lastHuluIso && umur >= 0 && umur < inp.idleDays) {
    return { boleh: false, larangan: [`Penawaran baru berumur ${umur} hari (< ${inp.idleDays} hari)`], kategori: null, alasan: `Penawaran baru berumur ${umur} hari (< ${inp.idleDays} hari)` };
  }
  const huluTxt = inp.lastHuluIso ? ` (hulu terakhir ${isoToSlash(inp.lastHuluIso)})` : '';
  return {
    boleh: true,
    larangan,
    kategori: 'B_BATAL',
    alasan: `Penawaran batal / tidak lanjut ke Order Produksi${huluTxt} (saldo 0.00)`,
  };
}
