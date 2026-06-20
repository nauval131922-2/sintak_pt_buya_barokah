import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return getDateStr(dt);
}

function modus<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  const freq = new Map<T, number>();
  for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
  let best: T = arr[0];
  let bestCount = 0;
  for (const [v, c] of freq) {
    if (c > bestCount) { best = v; bestCount = c; }
  }
  return best;
}

function avg(arr: number[]): number | null {
  if (!arr.length) return null;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

const BAGIAN_ORDER: Record<string, number> = {
  'SETTING': 1,
  'QUALITY CONTROL': 2,
  'QC': 2,
  'CETAK': 3,
  'FINISHING': 4,
  'GUDANG': 5,
  'TEKNISI': 6,
  'MESIN': 7,
};
const BAGIAN_SORT = ['SETTING', 'QUALITY CONTROL', 'CETAK', 'FINISHING', 'GUDANG', 'TEKNISI', 'MESIN'];
// Bagian yang tidak terikat ke order produksi — tidak perlu matching order
const BAGIAN_TANPA_ORDER = new Set(['TEKNISI', 'MESIN']);

// ============================================================
// FALLBACK: logika lama — copy dari hari terakhir yang ada data
// ============================================================
async function buildFallbackDraft(targetDate: string) {
  const target = new Date(targetDate + 'T00:00:00+07:00');
  let sourceDate = '';
  for (let i = 1; i <= 7; i++) {
    const d = new Date(target.getTime() - i * 86400000);
    const ds = getDateStr(d);
    const check = await db.execute({
      sql: `SELECT COUNT(*) as c FROM jurnal_harian_produksi WHERE tgl = ? AND deleted_at IS NULL`,
      args: [ds]
    });
    if (Number((check.rows[0] as any).c) > 0) { sourceDate = ds; break; }
  }
  if (!sourceDate) return { data: [], sourceDate: null, resolvedDate: targetDate, mode: 'fallback' as const, meta: null };

  const result = await db.execute({
    sql: `SELECT id, posisi, absensi, shift, nama_karyawan, no_order, nama_order,
                 jenis_pekerjaan, keterangan, target, realisasi, bagian, is_manual_input,
                 nama_order_manual, nama_order_manual_2
          FROM jurnal_harian_produksi
          WHERE tgl = ? AND deleted_at IS NULL`,
    args: [sourceDate]
  });

  const sections = ['SETTING', 'QUALITY CONTROL', 'CETAK', 'FINISHING', 'GUDANG', 'TEKNISI'];
  const koordinasiSet = new Set<string>();
  for (const row of result.rows as any[]) {
    if ((row.jenis_pekerjaan || '').toLowerCase().includes('koordinasi')) {
      koordinasiSet.add(row.nama_karyawan + '|' + sourceDate);
    }
  }

  const sortedRows = [...result.rows].sort((a: any, b: any) => {
    const getInfo = (row: any) => {
      const bUpper = String(row.bagian || '').toUpperCase();
      const jp = (row.jenis_pekerjaan || '').toLowerCase();
      const index = sections.indexOf(bUpper);
      return {
        index: index === -1 ? 99 : index,
        isKoordinasi: jp.includes('koordinasi'),
        hasKoordinasi: koordinasiSet.has(row.nama_karyawan + '|' + sourceDate),
        absensi: Number(row.absensi || 0),
        id: Number(row.id || 0),
      };
    };
    const infoA = getInfo(a);
    const infoB = getInfo(b);
    if (infoA.index !== infoB.index) return infoA.index - infoB.index;
    if (infoA.hasKoordinasi && !infoB.hasKoordinasi) return -1;
    if (!infoA.hasKoordinasi && infoB.hasKoordinasi) return 1;
    if (infoA.isKoordinasi && !infoB.isKoordinasi) return -1;
    if (!infoA.isKoordinasi && infoB.isKoordinasi) return 1;
    if (infoA.absensi !== infoB.absensi) return infoA.absensi - infoB.absensi;
    return infoA.id - infoB.id;
  });

  const karyawanResult = await db.execute({
    sql: `SELECT DISTINCT nama_karyawan, bagian FROM jurnal_harian_produksi
          WHERE tgl = ? AND deleted_at IS NULL AND nama_karyawan IS NOT NULL AND nama_karyawan != ''
          ORDER BY nama_karyawan ASC`,
    args: [sourceDate]
  });
  const karyawanOptions = karyawanResult.rows.map((r: any) => ({ nama: r.nama_karyawan, bagian: r.bagian }));

  const rows = sortedRows.map((r: any) => {
    const nama = r.nama_karyawan ?? '';
    const bagian = r.bagian ?? '';
    const shift = r.shift ?? '';
    const jp = r.jenis_pekerjaan ?? '';
    const no = r.no_order ?? '';
    const nm = r.nama_order ?? '';
    const target = r.target;
    const realisasi = r.realisasi;

    let alasan = `Fallback dari ${sourceDate}`;
    if (no && no !== '-' && nm && nm !== '-') {
      alasan += ` — Order ${no} (${nm}) — ${jp} — ${nama} ${bagian} shift ${shift}`;
    } else {
      alasan += ` — ${nama} ${bagian} shift ${shift}`;
    }

    return {
      _draftId: crypto.randomUUID(),
      _sourceType: 'fallback' as const,
      posisi: r.posisi ?? 0,
      absensi: r.absensi ?? 0,
      shift, nama_karyawan: nama, no_order: no, nama_order: nm,
      jenis_pekerjaan: jp, keterangan: r.keterangan ?? '',
      target, realisasi, bagian,
      is_manual_input: r.is_manual_input ?? 0,
      nama_order_manual: r.nama_order_manual ?? '',
      nama_order_manual_2: r.nama_order_manual_2 ?? '',
      _alasan: alasan,
    };
  });

  return { data: rows, sourceDate, resolvedDate: targetDate, karyawanOptions, mode: 'fallback' as const, meta: null };
}

// ============================================================
// MAIN HANDLER
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const targetDateRaw = searchParams.get('date');
    if (!targetDateRaw || !/^\d{4}-\d{2}-\d{2}$/.test(targetDateRaw)) {
      return NextResponse.json({ error: 'Parameter date wajib (YYYY-MM-DD)' }, { status: 400 });
    }

    // --------------------------------------------------------
    // ISU 4: Auto-detect tanggal yang belum ada jadwal
    // Mulai dari targetDateRaw, cek ke depan sampai 30 hari
    // sampai menemukan hari yang belum ada data
    // --------------------------------------------------------
    let targetDate = targetDateRaw;
    for (let i = 0; i < 30; i++) {
      const checkDate = addDays(targetDateRaw, i);
      const check = await db.execute({
        sql: `SELECT COUNT(*) as c FROM jurnal_harian_produksi WHERE tgl = ? AND deleted_at IS NULL`,
        args: [checkDate]
      });
      if (Number((check.rows[0] as any).c) === 0) {
        targetDate = checkDate;
        break;
      }
      // Jika sudah 30 hari semua ada data, gunakan hari ke-30
      if (i === 29) targetDate = checkDate;
    }

    // Batas waktu untuk query historis
    const date30d = addDays(targetDate, -30);
    const date7d  = addDays(targetDate, -7);

    // --------------------------------------------------------
    // STEP 1 — Ambil data historis 30 hari sebelum targetDate
    // --------------------------------------------------------
    const historisResult = await db.execute({
      sql: `SELECT nama_karyawan, bagian, shift, jenis_pekerjaan,
                   no_order, nama_order, tgl, target, realisasi,
                   posisi, absensi, keterangan,
                   is_manual_input, nama_order_manual, nama_order_manual_2
            FROM jurnal_harian_produksi
            WHERE tgl >= ? AND tgl < ? AND deleted_at IS NULL
            ORDER BY tgl DESC`,
      args: [date30d, targetDate]
    });

    const historis = historisResult.rows as any[];

    // Pisahkan: data 7 hari terakhir (untuk "aktif")
    const historis7d = historis.filter(r => r.tgl >= date7d);

    // Karyawan yang muncul dalam 7 hari terakhir = karyawan aktif
    const karyawanAktifSet = new Set<string>(
      historis7d.map(r => r.nama_karyawan).filter(Boolean)
    );

    if (karyawanAktifSet.size === 0) {
      const fb = await buildFallbackDraft(targetDate);
      return NextResponse.json({ success: true, ...fb });
    }

    // --------------------------------------------------------
    // STEP 2 — Hitung pola per karyawan dari 30 hari
    // --------------------------------------------------------
    type KomboFreq = {
      bagian: string;
      jp: string;
      count: number;          // frekuensi muncul dalam 7d (untuk urutan)
      shifts: string[];       // shifts yang dipakai untuk combo ini
      keterangans: string[];  // keterangan yang pernah dipakai
    };
    type KaryawanPola = {
      posisi: number;
      absensi: number;
      // Semua kombinasi (bagian, jp) yang pernah dilakukan dalam 7 hari terakhir
      // key: "bagian|jp", value: KomboFreq
      kombos7d: Map<string, KomboFreq>;
      // Shift dominan keseluruhan (fallback)
      allShifts: string[];
      // Batas jumlah baris per hari berdasarkan rata-rata historis 30 hari
      limitBarisPerHari: number;
    };
    const polaPerkaryawan = new Map<string, KaryawanPola>();

    // Map untuk menampung jumlah baris per karyawan per hari dalam 30 hari
    // nama_karyawan -> Map<tgl, jumlah_baris>
    const harianTracker = new Map<string, Map<string, number>>();

    // Pass 1: bangun dari 30 hari (posisi, absensi, shift, harianTracker)
    for (const r of historis) {
      const nama: string = r.nama_karyawan || '';
      if (!nama) continue;
      
      // Init pola tracker
      if (!polaPerkaryawan.has(nama)) {
        polaPerkaryawan.set(nama, { posisi: 0, absensi: 0, kombos7d: new Map(), allShifts: [], limitBarisPerHari: 1 });
      }
      const p = polaPerkaryawan.get(nama)!;
      if (r.shift) p.allShifts.push(String(r.shift));
      if (p.posisi === 0 && r.posisi) p.posisi = Number(r.posisi);
      if (p.absensi === 0 && r.absensi) p.absensi = Number(r.absensi);

      // Hitung baris per hari
      if (!harianTracker.has(nama)) {
        harianTracker.set(nama, new Map<string, number>());
      }
      const tglMap = harianTracker.get(nama)!;
      const tglStr = r.tgl || '';
      if (tglStr) {
        tglMap.set(tglStr, (tglMap.get(tglStr) ?? 0) + 1);
      }
    }

    // Hitung rata-rata baris per hari untuk tiap karyawan
    for (const [nama, tglMap] of harianTracker.entries()) {
      const p = polaPerkaryawan.get(nama);
      if (!p) continue;
      const totalDays = tglMap.size;
      if (totalDays > 0) {
        let sum = 0;
        for (const count of tglMap.values()) {
          sum += count;
        }
        // Ambil rata-rata, bulatkan ke atas agar tidak kehilangan pekerjaan, minimal 1 baris, maksimal 8 baris
        p.limitBarisPerHari = Math.min(8, Math.max(1, Math.ceil(sum / totalDays)));
      }
    }

    // Pass 2: bangun kombos7d dari historis 7 hari (ini yang jadi baris draft)
    for (const r of historis7d) {
      const nama: string = r.nama_karyawan || '';
      if (!nama) continue;
      const bagian: string = (r.bagian || '').toUpperCase();
      const jp: string = r.jenis_pekerjaan || '';
      if (!bagian && !jp) continue;

      const p = polaPerkaryawan.get(nama);
      if (!p) continue;

      const key = `${bagian}|${jp}`;
      if (!p.kombos7d.has(key)) {
        p.kombos7d.set(key, { bagian, jp, count: 0, shifts: [], keterangans: [] });
      }
      const combo = p.kombos7d.get(key)!;
      combo.count++;
      if (r.shift) combo.shifts.push(String(r.shift));
      if (r.keterangan && String(r.keterangan).trim()) {
        combo.keterangans.push(String(r.keterangan).trim());
      }
    }

    // --------------------------------------------------------
    // ISU 3 — Bangun lookup rata-rata target dari historis
    // Key prioritas:
    //   L1: nama_karyawan|jenis_pekerjaan|no_order
    //   L2: jenis_pekerjaan|no_order
    //   L3: jenis_pekerjaan|bagian
    // --------------------------------------------------------
    const targetL1 = new Map<string, number[]>(); // nama|jp|no_order → targets[]
    const targetL2 = new Map<string, number[]>(); // jp|no_order → targets[]
    const targetL3 = new Map<string, number[]>(); // jp|bagian → targets[]

    for (const r of historis) {
      const t = r.target != null ? Number(r.target) : null;
      if (t == null || t <= 0) continue;
      const nama: string = r.nama_karyawan || '';
      const jp: string = r.jenis_pekerjaan || '';
      const no: string = r.no_order || '';
      const bagian: string = (r.bagian || '').toUpperCase();

      if (nama && jp && no) {
        const k1 = `${nama}|${jp}|${no}`;
        if (!targetL1.has(k1)) targetL1.set(k1, []);
        targetL1.get(k1)!.push(t);
      }
      if (jp && no) {
        const k2 = `${jp}|${no}`;
        if (!targetL2.has(k2)) targetL2.set(k2, []);
        targetL2.get(k2)!.push(t);
      }
      if (jp && bagian) {
        const k3 = `${jp}|${bagian}`;
        if (!targetL3.has(k3)) targetL3.set(k3, []);
        targetL3.get(k3)!.push(t);
      }
    }

    function resolveTarget(nama: string, jp: string, no: string, bagian: string): number | null {
      if (nama && jp && no) {
        const v = avg(targetL1.get(`${nama}|${jp}|${no}`) ?? []);
        if (v != null) return v;
      }
      if (jp && no) {
        const v = avg(targetL2.get(`${jp}|${no}`) ?? []);
        if (v != null) return v;
      }
      if (jp && bagian) {
        const v = avg(targetL3.get(`${jp}|${bagian}`) ?? []);
        if (v != null) return v;
      }
      return null;
    }

    // --------------------------------------------------------
    // STEP 3 — Tentukan order aktif dari tabel orders vs barang_jadi
    // Order aktif = orders yang qty produksi (SUM barang_jadi.qty per faktur_prd)
    // masih kurang dari qty order, periode awal bulan ini sampai sekarang
    // --------------------------------------------------------
    const now = new Date();
    const bulanIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const orderAktifQuery = await db.execute({
      sql: `
        SELECT
          o.faktur AS no_order,
          o.nama_prd AS nama_order,
          o.qty AS qty_order,
          COALESCE(SUM(bj.qty), 0) AS qty_terima
        FROM orders o
        LEFT JOIN barang_jadi bj ON bj.faktur_prd = o.faktur
        LEFT JOIN sopd_harga sh ON sh.no_sopd = o.faktur
        WHERE o.tgl >= ?
          AND (sh.pending_produksi IS NULL OR sh.pending_produksi != 1)
        GROUP BY o.faktur, o.nama_prd, o.qty
        HAVING qty_order > qty_terima
        ORDER BY o.tgl DESC
      `,
      args: [bulanIni],
    });

    type OrderInfo = {
      no_order: string;
      nama_order: string;
      bagianTerakhir: string;
      bagianTerakhirLevel: number;
      tglTerakhir: string;
      hariKe: number;
      karyawanPernah: Map<string, Set<string>>; // bagian → Set<nama_karyawan>
    };

    const orderAktif = new Map<string, OrderInfo>();
    for (const row of orderAktifQuery.rows as any[]) {
      orderAktif.set(row.no_order, {
        no_order: row.no_order,
        nama_order: row.nama_order ?? '',
        bagianTerakhir: '',
        bagianTerakhirLevel: 0,
        tglTerakhir: '',
        hariKe: 0,
        karyawanPernah: new Map(),
      });
    }

    // Enrichment: isi bagianTerakhir, hariKe, karyawanPernah dari historis jurnal 30 hari
    for (const r of [...historis].reverse()) {
      const no: string = r.no_order || '';
      if (!no || no === '-' || !orderAktif.has(no)) continue;
      const oi = orderAktif.get(no)!;
      const bagian: string = (r.bagian || '').toUpperCase();
      const level = BAGIAN_ORDER[bagian] ?? 99;
      if (level > oi.bagianTerakhirLevel) {
        oi.bagianTerakhir = bagian;
        oi.bagianTerakhirLevel = level;
      }
      oi.tglTerakhir = r.tgl;
      if (bagian && r.nama_karyawan) {
        if (!oi.karyawanPernah.has(bagian)) oi.karyawanPernah.set(bagian, new Set());
        oi.karyawanPernah.get(bagian)!.add(String(r.nama_karyawan));
      }
    }

    // Hitung hariKe dari historis jurnal
    const orderHariUnique = new Map<string, Set<string>>();
    for (const r of historis) {
      const no: string = r.no_order || '';
      if (!no || no === '-' || !orderAktif.has(no)) continue;
      if (!orderHariUnique.has(no)) orderHariUnique.set(no, new Set());
      orderHariUnique.get(no)!.add(String(r.tgl));
    }
    for (const [no, hariSet] of orderHariUnique) {
      if (orderAktif.has(no)) orderAktif.get(no)!.hariKe = hariSet.size;
    }

    // --------------------------------------------------------
    // STEP 4 — Bangun draft rows: multiple rows per karyawan
    // Setiap kombinasi (bagian, jp) yang pernah dilakukan dalam
    // 7 hari terakhir → 1 draft row
    // --------------------------------------------------------
    type DraftRow = {
      _draftId: string;
      _sourceType: 'pola_historis' | 'order_aktif' | 'fallback';
      _alasan: string;
      posisi: number;
      absensi: number;
      shift: string;
      nama_karyawan: string;
      no_order: string;
      nama_order: string;
      jenis_pekerjaan: string;
      keterangan: string;
      target: number | null;
      realisasi: number | null;
      bagian: string;
      is_manual_input: number;
      nama_order_manual: string;
      nama_order_manual_2: string;
    };

    const draftRows: DraftRow[] = [];

    for (const nama of karyawanAktifSet) {
      const pola = polaPerkaryawan.get(nama);
      if (!pola) continue;

      // Urutkan kombos dari yang paling sering muncul
      const sortedKombos = [...pola.kombos7d.values()].sort((a, b) => b.count - a.count);

      if (sortedKombos.length === 0) continue;

      let barisGenerated = 0;
      for (const combo of sortedKombos) {
        const { bagian, jp, count, shifts, keterangans } = combo;
        const isKoordinasi = jp.toLowerCase().includes('koordinasi');

        // Batasi jumlah baris per karyawan agar tidak overload
        // Aturan: selalu masukkan Koordinasi, tapi untuk pekerjaan biasa batasi maks limitBarisPerHari
        const layakGenerate = barisGenerated < pola.limitBarisPerHari || isKoordinasi;

        if (!layakGenerate) continue;

        // Shift: modus dari shift yang dipakai di combo ini, fallback ke shift dominan keseluruhan
        const shiftCombo = modus(shifts.length > 0 ? shifts : pola.allShifts) ?? '1';

        // Keterangan: modus dari keterangan yang pernah dipakai untuk combo ini
        const keteranganModus = modus(keterangans) ?? '';

        // Bagian tertentu (TEKNISI, MESIN) tidak terikat ke order produksi
        const bagianButuhOrder = !BAGIAN_TANPA_ORDER.has(bagian) && !isKoordinasi;

        // Cari order aktif — hanya untuk bagian yang butuh order
        let matchedOrder: OrderInfo | null = null;

        if (bagianButuhOrder) {
          // Prioritas 1: order aktif yang karyawan ini pernah kerjakan di bagian yang sama
          for (const [, oi] of orderAktif) {
            const karyawanDiBagian = oi.karyawanPernah.get(bagian);
            if (karyawanDiBagian && karyawanDiBagian.has(nama)) {
              matchedOrder = oi;
              break;
            }
          }

          // Prioritas 2: order aktif yang pernah dikerjakan karyawan ini di bagian manapun
          if (!matchedOrder) {
            for (const [, oi] of orderAktif) {
              for (const [, karyawanSet] of oi.karyawanPernah) {
                if (karyawanSet.has(nama)) {
                  matchedOrder = oi;
                  break;
                }
              }
              if (matchedOrder) break;
            }
          }

          // Prioritas 3: order aktif yang level bagiannya paling dekat dengan bagian ini
          if (!matchedOrder && bagian) {
            const bagianLevel = BAGIAN_ORDER[bagian] ?? 99;
            let bestDiff = 999;
            for (const [, oi] of orderAktif) {
              const diff = Math.abs(oi.bagianTerakhirLevel - bagianLevel);
              if (diff < bestDiff) {
                bestDiff = diff;
                matchedOrder = oi;
              }
            }
          }
        }

        const noOrder = matchedOrder?.no_order ?? '';
        const namaOrder = matchedOrder?.nama_order ?? '';
        const hariKe = matchedOrder?.hariKe ?? 0;

        // Target dari pola historis (hanya untuk bagian yang butuh order)
        const resolvedTarget = bagianButuhOrder ? resolveTarget(nama, jp, noOrder, bagian) : null;

        // Alasan & sourceType
        let alasan = '';
        let sourceType: DraftRow['_sourceType'] = 'pola_historis';

        if (bagianButuhOrder && matchedOrder && hariKe > 0) {
          sourceType = 'order_aktif';
          alasan = `Pola ${count}x/7hari: ${bagian} shift ${shiftCombo} — ${jp} — Order ${noOrder}${namaOrder ? ` (${namaOrder})` : ''} aktif hari ke-${hariKe}`;
          if (resolvedTarget != null) alasan += ` — target rata-rata ${resolvedTarget.toLocaleString('id-ID')}`;
        } else if (isKoordinasi) {
          sourceType = 'pola_historis';
          alasan = `Koordinasi: ${bagian} shift ${shiftCombo} — muncul ${count}x dalam 7 hari`;
        } else if (BAGIAN_TANPA_ORDER.has(bagian)) {
          sourceType = 'pola_historis';
          alasan = `Pola ${count}x/7hari: ${bagian} shift ${shiftCombo}${jp ? ` — ${jp}` : ''} — tidak terikat order`;
        } else if (bagianButuhOrder && noOrder) {
          sourceType = 'order_aktif';
          alasan = `Pola ${count}x/7hari: ${bagian} shift ${shiftCombo} — ${jp} — Order ${noOrder}${namaOrder ? ` (${namaOrder})` : ''}`;
          if (resolvedTarget != null) alasan += ` — target rata-rata ${resolvedTarget.toLocaleString('id-ID')}`;
        } else {
          sourceType = 'pola_historis';
          alasan = `Pola ${count}x/7hari: ${bagian} shift ${shiftCombo}${jp ? ` — ${jp}` : ''} — belum ada order cocok`;
        }

        draftRows.push({
          _draftId: crypto.randomUUID(),
          _sourceType: sourceType,
          _alasan: alasan,
          posisi: pola.posisi,
          absensi: pola.absensi,
          shift: shiftCombo,
          nama_karyawan: nama,
          no_order: bagianButuhOrder ? noOrder : '',
          nama_order: bagianButuhOrder ? namaOrder : '',
          jenis_pekerjaan: jp,
          keterangan: keteranganModus,
          target: resolvedTarget,
          realisasi: null,
          bagian,
          is_manual_input: 0,
          nama_order_manual: '',
          nama_order_manual_2: '',
        });
        barisGenerated++;
      }
    }

    // --------------------------------------------------------
    // STEP 5 — Jika 0 baris → fallback
    // --------------------------------------------------------
    if (draftRows.length === 0) {
      const fb = await buildFallbackDraft(targetDate);
      return NextResponse.json({ success: true, ...fb });
    }

    // --------------------------------------------------------
    // STEP 6 — Sort: bagian → koordinasi → absensi
    // --------------------------------------------------------
    const koordinasiSet = new Set<string>();
    for (const row of draftRows) {
      if ((row.jenis_pekerjaan || '').toLowerCase().includes('koordinasi')) {
        koordinasiSet.add(row.nama_karyawan);
      }
    }

    draftRows.sort((a, b) => {
      const idxA = BAGIAN_SORT.indexOf(a.bagian?.toUpperCase?.() ?? '');
      const idxB = BAGIAN_SORT.indexOf(b.bagian?.toUpperCase?.() ?? '');
      const ia = idxA === -1 ? 99 : idxA;
      const ib = idxB === -1 ? 99 : idxB;
      if (ia !== ib) return ia - ib;

      const hasKA = koordinasiSet.has(a.nama_karyawan);
      const hasKB = koordinasiSet.has(b.nama_karyawan);
      if (hasKA && !hasKB) return -1;
      if (!hasKA && hasKB) return 1;

      const isKA = (a.jenis_pekerjaan || '').toLowerCase().includes('koordinasi');
      const isKB = (b.jenis_pekerjaan || '').toLowerCase().includes('koordinasi');
      if (isKA && !isKB) return -1;
      if (!isKA && isKB) return 1;

      if (a.absensi !== b.absensi) return a.absensi - b.absensi;
      return a.nama_karyawan.localeCompare(b.nama_karyawan);
    });

    // --------------------------------------------------------
    // STEP 7 — Karyawan options dari 7 hari terakhir
    // --------------------------------------------------------
    const karyawanMap = new Map<string, string>();
    for (const r of historis7d) {
      if (r.nama_karyawan && !karyawanMap.has(r.nama_karyawan)) {
        karyawanMap.set(String(r.nama_karyawan), String(r.bagian || ''));
      }
    }
    const karyawanOptions = [...karyawanMap.entries()].map(([nama, bagian]) => ({ nama, bagian }));

    const meta = {
      mode: 'historis' as const,
      karyawanAktif: karyawanAktifSet.size,
      orderAktif: orderAktif.size,
      windowHari: 30,
    };

    return NextResponse.json({
      success: true,
      data: draftRows,
      karyawanOptions,
      sourceDate: null,
      resolvedDate: targetDate,
      mode: 'historis',
      meta,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
