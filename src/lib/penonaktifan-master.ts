// penonaktifan-master.ts — Klasifikasi 4 pilar Lap. Penonaktifan Master Barang Jadi.
// Cakupan: kd_golongan = 'Barang Jadi Pesanan', saldo 0, status Aktif (checked).
// Pilar 2 = filter pelindung: DILARANG tutup walau saldo 0.

export const GOLONGAN_BJP = 'Barang Jadi Pesanan';

// Rumpun terbitan rutin Yayasan (continuous multi-batch, saldo 0 = jeda antar-batch).
export const ROUTINE_NAME_RE = /al[\s\-_]*quddus|yanbu/i;

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

export function isRoutineProduct(nama: unknown): boolean {
  return ROUTINE_NAME_RE.test(String(nama ?? ''));
}

export interface KlasifikasiInput {
  kode: string;
  nama: string;
  totPR: number; // oplah SPK s.d. cutoff
  totPD: number; // realisasi hasil s.d. cutoff
  lastSelesai: number | null; // flag penyerahan terakhir (0 = masih jalan)
  lastWipAkhir: number | null;
  hasPostCutoffPD: boolean; // ada setoran PD setelah cutoff
  hasOutflow: boolean; // ada PJ/SO/pengiriman
  hasHulu: boolean; // ada jejak BOM/QO/SO (pendukung kategori Batal)
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

// Klasifikasi murni (tanpa I/O): Pilar 2 dulu, baru tentukan kategori + alasan.
export function klasifikasiItem(inp: KlasifikasiInput): KlasifikasiResult {
  const larangan: string[] = [];
  const totPR = Number(inp.totPR || 0);
  const totPD = Number(inp.totPD || 0);

  if (isRoutineProduct(inp.nama)) {
    larangan.push('Produk terbitan rutin Yayasan (multi-batch continuous)');
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

  if (larangan.length > 0) {
    return { boleh: false, larangan, kategori: null, alasan: larangan.join('; ') };
  }

  if (totPR > 0) {
    return {
      boleh: true,
      larangan,
      kategori: 'A_LUDES',
      alasan: `SPK tuntas (PR=${fmtNum(totPR)}, PD=${fmtNum(totPD)})${inp.hasOutflow ? ', outflow tercatat' : ''} (saldo 0.00)`,
    };
  }
  return {
    boleh: true,
    larangan,
    kategori: 'B_BATAL',
    alasan: `Penawaran batal / tidak lanjut ke Order Produksi${inp.hasHulu ? ' (ada jejak hulu)' : ''} (saldo 0.00)`,
  };
}
