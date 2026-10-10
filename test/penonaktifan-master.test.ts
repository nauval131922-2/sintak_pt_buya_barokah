import { describe, it, expect } from 'vitest';
import {
  stripHtmlTags,
  extractFakturPrd,
  isMasterAktif,
  ddMmYyyyToIso,
  isoToSlash,
  klasifikasiItem,
  type KlasifikasiInput,
} from '@/lib/penonaktifan-master';
import { isRoutineProduct } from '@/lib/penonaktifan-settings';

const base: KlasifikasiInput = {
  kode: 'X',
  totPR: 0,
  totPD: 0,
  lastSelesai: null,
  lastWipAkhir: null,
  hasPostCutoffPD: false,
  hasPostCutoffPR: false,
  isRoutine: false,
  outflows: [],
  lastHuluIso: '',
  lastHuluFaktur: '',
  idleDays: 7,
  cutoffIso: '2026-10-10',
 };

describe('stripHtmlTags / extractFakturPrd', () => {
  it('membersihkan tag HTML Digit dari faktur_prd BOM', () => {
    expect(extractFakturPrd('<i class="fa fa-check-circle text-success"></i> PR00126042800002')).toBe('PR00126042800002');
  });

  it('faktur bersih tetap utuh', () => {
    expect(extractFakturPrd('PR00124103100367')).toBe('PR00124103100367');
  });

  it('stripHtmlTags menangani null', () => {
    expect(stripHtmlTags(null)).toBe('');
  });
});

describe('isMasterAktif', () => {
  it('checked = Aktif', () => {
    expect(isMasterAktif('<input type="checkbox" onclick="bo.mbrg.status(this, \'261000089\')" checked>')).toBe(true);
  });

  it('tanpa checked = Nonaktif', () => {
    expect(isMasterAktif('<input type="checkbox" onclick="bo.mbrg.status(this, \'250700114\')" >')).toBe(false);
  });
});

describe('ddMmYyyyToIso / isoToSlash', () => {
  it('konversi dd-mm-yyyy ke ISO', () => {
    expect(ddMmYyyyToIso('31-10-2024')).toBe('2024-10-31');
    expect(ddMmYyyyToIso('05-09-2026')).toBe('2026-09-05');
  });

  it('format tak valid jadi string kosong', () => {
    expect(ddMmYyyyToIso('2026-09-05')).toBe('');
    expect(ddMmYyyyToIso(null)).toBe('');
  });

  it('ISO ke slash id', () => {
    expect(isoToSlash('2026-08-23')).toBe('23/08/2026');
  });
});

describe('isRoutineProduct (settings)', () => {
  const s = { routine_keywords: ['al-quddus', 'yanbu'], routine_codes: ['260900101'], idle_days: 7 };
  it('keyword cocok', () => {
    expect(isRoutineProduct('Al-Quddus B3 Tgg HVS', '241007505', s)).toBe(true);
    expect(isRoutineProduct("Yanbu'a Jilid 2", '241007499', s)).toBe(true);
  });
  it('kode eksplisit cocok walau nama umum', () => {
    expect(isRoutineProduct('Buku Tulis NN', '260900101', s)).toBe(true);
  });
  it('non-rutin lolos', () => {
    expect(isRoutineProduct('Buku Soft Cover Portrait', '260800450', s)).toBe(false);
  });
});

describe('klasifikasiItem (4 pilar)', () => {
  it('Pilar 2: oplah belum tuntas dilarang walau saldo 0', () => {
    const r = klasifikasiItem({ ...base, kode: '260700044', totPR: 38000, totPD: 9270, lastSelesai: 0, lastWipAkhir: 0 });
    expect(r.boleh).toBe(false);
    expect(r.alasan).toMatch(/belum tuntas/);
  });

  it('Pilar 2: produk rutin (settings) dilarang walau PR=PD', () => {
    const r = klasifikasiItem({
      ...base, kode: '250600260', totPR: 5000, totPD: 5000, lastSelesai: 1, lastWipAkhir: 0,
      isRoutine: true, outflows: [{ jenis: 'SV', faktur: 'SV00126100700001', tgl: '2026-10-07' }],
    });
    expect(r.boleh).toBe(false);
    expect(r.kategori).toBeNull();
  });

  it('Pilar 2: setoran pasca-cutoff dilarang', () => {
     const r = klasifikasiItem({
       ...base, kode: '260900508', totPR: 6600, totPD: 6600, lastSelesai: 1, lastWipAkhir: 0,
       hasPostCutoffPD: true, outflows: [{ jenis: 'PJ', faktur: 'PJ00126090000001', tgl: '2026-09-20' }],
     });
     expect(r.boleh).toBe(false);
  });
 
  it('Pilar 2: SPK susulan pasca-cutoff dilarang', () => {
     const r = klasifikasiItem({
       ...base, kode: '260900509', totPR: 6600, totPD: 6600, lastSelesai: 1, lastWipAkhir: 0,
         hasPostCutoffPR: true, outflows: [{ jenis: 'PJ', faktur: 'PJ00126090000001', tgl: '2026-09-20' }],
     });
     expect(r.boleh).toBe(false);
     expect(r.alasan).toMatch(/SPK\/order susulan/);
  });

  it('Kategori A: SPK tuntas + bukti PJ boleh, alasan ada faktur', () => {
    const r = klasifikasiItem({
      ...base, kode: '260800450', totPR: 1000, totPD: 1000, lastSelesai: 1, lastWipAkhir: 0,
      outflows: [{ jenis: 'PJ', faktur: 'PJ00126090000001', tgl: '2026-09-20' }],
    });
    expect(r.boleh).toBe(true);
    expect(r.kategori).toBe('A_LUDES');
    expect(r.alasan).toMatch(/PJ00126090000001/);
    expect(r.alasan).toMatch(/20\/09\/2026/);
  });

  it('Kategori A: SPK tuntas TANPA outflow ditolak', () => {
    const r = klasifikasiItem({ ...base, kode: '260800450', totPR: 1000, totPD: 1000, lastSelesai: 1, lastWipAkhir: 0 });
    expect(r.boleh).toBe(false);
    expect(r.alasan).toMatch(/belum ada bukti keluar/);
  });

  it('Kategori B: tanpa PR + idle cukup boleh, alasan ada faktur QO', () => {
     const r = klasifikasiItem({ ...base, kode: '260800451', lastHuluIso: '2026-08-23', lastHuluFaktur: 'QO00126082300001' });
     expect(r.boleh).toBe(true);
     expect(r.kategori).toBe('B_BATAL');
     expect(r.alasan).toMatch(/QO00126082300001/);
     expect(r.alasan).toMatch(/23\/08\/2026/);
  });
 
  it('Kategori B: tanpa faktur QO pakai teks hulu terakhir', () => {
     const r = klasifikasiItem({ ...base, kode: '260800451', lastHuluIso: '2026-08-23' });
     expect(r.boleh).toBe(true);
     expect(r.alasan).toMatch(/hulu terakhir 23\/08\/2026/);
  });

  it('Kategori B: penawaran baru (< idle) ditolak', () => {
    const r = klasifikasiItem({ ...base, kode: '260800451', lastHuluIso: '2026-10-08' });
    expect(r.boleh).toBe(false);
    expect(r.alasan).toMatch(/2 hari/);
  });
});
