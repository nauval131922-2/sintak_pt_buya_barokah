export interface RealisasiData {
  nama_karyawan?: string;
  absensi?: string;
  tgl: string;
  shift: string;
  order?: string;
  pekerjaan?: string;
  target?: string;
  realisasi: string;
  bahan?: string;
  warna?: string;
  inscheet?: string;
  rijek?: string;
  plate?: string;
  jam?: string;
  kendala?: string;
  keterangan?: string;
}

export function parseRealisasiTemplate(text: string): RealisasiData | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const data: any = {};

  for (const line of lines) {
    // Skip command lines
    if (line.startsWith('/')) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    if (!value) continue;

    // Map keys to data fields
    if (key === 'nama' || key === 'nama karyawan' || key === 'karyawan' || key === 'operator') {
      data.nama_karyawan = value;
    } else if (key === 'absensi' || key === 'id karyawan' || key === 'employee no') {
      data.absensi = value.replace(/[^0-9]/g, '');
    } else if (key === 'tgl' || key === 'tanggal') {
      data.tgl = value;
    } else if (key === 'shift') {
      data.shift = value.replace(/[^0-9]/g, ''); // Extract number only
    } else if (key === 'order' || key === 'no order' || key === 'no. order') {
      data.order = value;
    } else if (key === 'pekerjaan' || key === 'jenis pekerjaan') {
      data.pekerjaan = value;
    } else if (key === 'target') {
      data.target = value.replace(/\./g, ''); // Remove thousand separator
    } else if (key === 'realisasi') {
      data.realisasi = value.replace(/\./g, '');
    } else if (key === 'bahan' || key === 'bahan kertas') {
      data.bahan = value;
    } else if (key === 'warna') {
      data.warna = value;
    } else if (key === 'inscheet') {
      data.inscheet = value.replace(/\./g, '');
    } else if (key === 'rijek') {
      data.rijek = value.replace(/\./g, '');
    } else if (key === 'plate' || key === 'jml plate') {
      data.plate = value.replace(/\./g, '');
    } else if (key === 'jam' || key === 'jam kerja') {
      data.jam = value;
    } else if (key === 'kendala') {
      data.kendala = value;
    } else if (key === 'keterangan') {
      data.keterangan = value;
    }
  }

  // Validasi field wajib
  if (!data.tgl || !data.shift || !data.realisasi) {
    return null;
  }

  return data as RealisasiData;
}

export function validateRealisasiData(data: RealisasiData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validasi tanggal format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tgl)) {
    errors.push('Format tanggal salah. Gunakan: YYYY-MM-DD (contoh: 2026-06-26)');
  }

  // Validasi shift (1, 2, atau 3)
  if (!['1', '2', '3'].includes(data.shift)) {
    errors.push('Shift harus 1, 2, atau 3');
  }

  // Validasi realisasi (harus angka)
  if (!/^\d+$/.test(data.realisasi)) {
    errors.push('Realisasi harus berupa angka');
  }

  // Validasi tanggal tidak di masa depan
  const inputDate = new Date(data.tgl + 'T12:00:00');
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    errors.push('Tanggal tidak boleh di masa depan');
  }

  if (diffDays > 7) {
    errors.push('Tanggal terlalu jauh di masa lalu. Maksimal 7 hari ke belakang');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
