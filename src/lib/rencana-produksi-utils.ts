/**
 * Utilitas dan Logika Bisnis Jadwal Rencana Produksi SINTAK
 * Mengadopsi aturan operasional PT Buya Barokah (Libur mingguan: hari Jumat).
 */

export interface RencanaProduksiTahapanItem {
  id?: number;
  rencana_id?: number;
  no_order: string;
  urutan: number;
  bagian: string;
  mesin?: string;
  nama_tahap: string;
  volume: number;
  target_per_hari: number;
  durasi_hari: number;
  tgl_mulai_plan: string;
  tgl_selesai_plan: string;
  catatan?: string;
}

export interface RencanaProduksiHeader {
  id?: number;
  no_order: string;
  nama_order: string;
  qty_oplah: number;
  satuan?: string;
  nama_pelanggan?: string;
  tgl_order?: string;
  tgl_deadline?: string;
  tgl_mulai_rencana: string;
  tgl_selesai_rencana: string;
  status: 'DRAFT' | 'DISETUJUI' | 'BERJALAN' | 'SELESAI';
  catatan?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRencanaProduksiPayload extends Omit<RencanaProduksiHeader, 'id' | 'created_at' | 'updated_at'> {
  tahapan: Array<Omit<RencanaProduksiTahapanItem, 'id' | 'rencana_id'>>;
}

/**
 * Cek apakah suatu tanggal adalah hari Jumat (libur operasional Buya Barokah)
 * atau tanggal libur nasional terdaftar.
 */
export function isHolidayOrFriday(date: Date, holidaySet?: Set<string>): boolean {
  if (date.getDay() === 5) return true; // 5 = Jumat
  if (holidaySet && holidaySet.size > 0) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    if (holidaySet.has(`${y}-${m}-${d}`)) return true;
  }
  return false;
}

/**
 * Menghitung durasi hari kerja dari volume dan target per hari.
 * Minimal 1 hari kerja jika ada volume.
 */
export function calculateDurationDays(volume: number, targetPerHari: number): number {
  if (volume <= 0) return 1;
  if (targetPerHari <= 0) return 1;
  return Math.max(1, Math.ceil(volume / targetPerHari));
}

/**
 * Menambahkan sejumlah hari kerja (workdays) mulai dari tanggal awal,
 * otomatis melompati hari Jumat dan tanggal libur terdaftar.
 */
export function addWorkdays(startDateISO: string, durationDays: number, holidaySet?: Set<string>): string {
  if (!startDateISO) return '';
  const d = new Date(startDateISO + 'T00:00:00');
  if (isNaN(d.getTime())) return startDateISO;

  // Jika tanggal awal jatuh di hari libur, geser ke hari kerja pertama berikutnya
  while (isHolidayOrFriday(d, holidaySet)) {
    d.setDate(d.getDate() + 1);
  }

  let remaining = Math.max(1, durationDays) - 1;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    if (!isHolidayOrFriday(d, holidaySet)) {
      remaining--;
    }
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format string tanggal sembarang menjadi format ISO 'YYYY-MM-DD'
 */
export function parseDateToISO(str?: string | null): string | null {
  if (!str) return null;
  const s = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return null;
}
