import { describe, it, expect } from 'vitest';
import {
  stripHtmlTags,
  extractFakturPrd,
  isMasterAktif,
  ddMmYyyyToIso,
  klasifikasiItem,
} from '@/lib/penonaktifan-master';

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

describe('ddMmYyyyToIso', () => {
  it('konversi dd-mm-yyyy ke ISO', () => {
    expect(ddMmYyyyToIso('31-10-2024')).toBe('2024-10-31');
    expect(ddMmYyyyToIso('05-09-2026')).toBe('2026-09-05');
  });

  it('format tak valid jadi string kosong', () => {
    expect(ddMmYyyyToIso('2026-09-05')).toBe('');
    expect(ddMmYyyyToIso(null)).toBe('');
  });
});

describe('klasifikasiItem (4 pilar)', () => {
  it('Pilar 2: oplah belum tuntas dilarang walau saldo 0', () => {
    const r = klasifikasiItem({
      kode: '260700044', nama: 'Stopmap Syahadah', totPR: 38000, totPD: 9270,
      lastSelesai: 0, lastWipAkhir: 0, hasPostCutoffPD: false, hasOutflow: true, hasHulu: true,
    });
    expect(r.boleh).toBe(false);
    expect(r.alasan).toMatch(/belum tuntas/);
  });

  it('Pilar 2: terbitan rutin dilarang walau PR=PD', () => {
    const r = klasifikasiItem({
      kode: '250600260', nama: "Al-Quddus A97 Kecil HVS", totPR: 5000, totPD: 5000,
      lastSelesai: 1, lastWipAkhir: 0, hasPostCutoffPD: false, hasOutflow: true, hasHulu: false,
    });
    expect(r.boleh).toBe(false);
    expect(r.kategori).toBeNull();
  });

  it('Pilar 2: setoran pasca-cutoff dilarang', () => {
    const r = klasifikasiItem({
      kode: '260900508', nama: 'Label SDIT', totPR: 6600, totPD: 6600,
      lastSelesai: 1, lastWipAkhir: 0, hasPostCutoffPD: true, hasOutflow: true, hasHulu: true,
    });
    expect(r.boleh).toBe(false);
  });

  it('Kategori A: SPK tuntas penuh boleh ditutup', () => {
    const r = klasifikasiItem({
      kode: '260800450', nama: 'Buku Soft Cover', totPR: 1000, totPD: 1000,
      lastSelesai: 1, lastWipAkhir: 0, hasPostCutoffPD: false, hasOutflow: true, hasHulu: true,
    });
    expect(r.boleh).toBe(true);
    expect(r.kategori).toBe('A_LUDES');
  });

  it('Kategori B: tanpa PR = penawaran batal', () => {
    const r = klasifikasiItem({
      kode: '260800451', nama: 'Buku Tulis NN', totPR: 0, totPD: 0,
      lastSelesai: null, lastWipAkhir: null, hasPostCutoffPD: false, hasOutflow: false, hasHulu: true,
    });
    expect(r.boleh).toBe(true);
    expect(r.kategori).toBe('B_BATAL');
  });
});
