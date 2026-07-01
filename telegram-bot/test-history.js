// Test: history edit + delete features
const { createClient } = require('@libsql/client');
const path = require('path');

async function setup(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS jurnal_harian_produksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT, posisi TEXT, absensi TEXT, tgl TEXT, shift TEXT,
    nama_karyawan TEXT, bagian TEXT, no_order TEXT, nama_order TEXT, jenis_pekerjaan TEXT, target TEXT,
    no_order_2 TEXT, nama_order_2 TEXT, jenis_pekerjaan_2 TEXT, realisasi TEXT,
    bahan_kertas TEXT, jml_plate TEXT, warna TEXT, inscheet TEXT, rijek TEXT, jam TEXT, kendala TEXT,
    keterangan TEXT, is_manual_input INTEGER, created_by TEXT,
    updated_at TEXT, updated_by TEXT, deleted_at TEXT, deleted_by TEXT
  )`);
  // Seed 3 records
  await db.execute(`INSERT INTO jurnal_harian_produksi (id, nama_karyawan, tgl, shift, bagian, no_order, nama_order, jenis_pekerjaan, target, realisasi, jam, kendala, is_manual_input, created_by) VALUES
    (1, 'Budi', '2026-06-29', '1', 'SETTING', 'OP.001', 'Order A', 'Setting Mesin', '100', '95', '07:00-15:00', '', 1, 'telegram-bot'),
    (2, 'Ani', '2026-06-28', '2', 'SETTING', 'OP.002', 'Order B', 'Potong Kertas', '50', '50', '15:00-23:00', 'Mesin macet', 1, 'telegram-bot'),
    (3, 'Cahyo', '2026-06-27', '1', 'SETTING', 'OP.003', 'Order C', 'Setting', '200', '', '', '', 1, 'telegram-bot')
  `);
}

// Simulate api.updateRealisasiField
async function updateField(db, id, data, updatedBy) {
  const cleanVal = (v) => {
    if (v === undefined || v === null || v === '') return '';
    const s = String(v).trim();
    return /^[0-9]+(\.[0-9]+)*$/.test(s) ? Number(s.replace(/\./g, '')) : s;
  };
  const sets = [];
  const args = [];
  for (const [k, v] of Object.entries(data)) {
    if (!['realisasi', 'jam', 'kendala', 'bahan_kertas', 'warna', 'inscheet', 'rijek', 'jml_plate', 'keterangan', 'no_order_2', 'nama_order_2', 'jenis_pekerjaan_2'].includes(k)) continue;
    sets.push(`${k} = ?`);
    args.push(k === 'realisasi' || k === 'inscheet' || k === 'rijek' || k === 'jml_plate' ? cleanVal(v) : v);
  }
  if (sets.length === 0) return { error: 'Tidak ada field yang diubah' };
  sets.push('updated_at = CURRENT_TIMESTAMP', 'updated_by = ?');
  args.push(updatedBy, id);
  await db.execute({ sql: `UPDATE jurnal_harian_produksi SET ${sets.join(', ')} WHERE id = ?`, args });
  return { success: true };
}

// Simulate api.softDeleteHistory
async function softDelete(db, id, deletedBy) {
  await db.execute({
    sql: `UPDATE jurnal_harian_produksi SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?`,
    args: [deletedBy, id]
  });
  return { success: true };
}

// Simulate parseEditTemplate
function parseEditTemplate(text) {
  const fields = {};
  const patterns = [
    [/^realisasi:\s*(.+)$/im, 'realisasi'],
    [/^jam:\s*(.+)$/im, 'jam'],
    [/^kendala:\s*(.+)$/im, 'kendala'],
    [/^bahan:\s*(.+)$/im, 'bahan_kertas'],
    [/^warna:\s*(.+)$/im, 'warna'],
    [/^inscheet:\s*(.+)$/im, 'inscheet'],
    [/^rijek:\s*(.+)$/im, 'rijek'],
    [/^plate:\s*(.+)$/im, 'jml_plate'],
    [/^keterangan:\s*(.+)$/im, 'keterangan'],
    [/^pekerjaan:\s*(.+)$/im, 'jenis_pekerjaan_2'],
  ];
  for (const [regex, key] of patterns) {
    const m = text.match(regex);
    if (m) fields[key] = m[1].trim();
  }
  return fields;
}

async function run() {
  let passed = 0, failed = 0;
  function check(label, condition) {
    if (condition) { passed++; console.log(`  ✅ ${label}`); }
    else { failed++; console.log(`  ❌ ${label}`); }
  }

  // ─── Test 1: Edit realisasi ─────────────────────────────────────
  {
    const db = createClient({ url: 'file::memory:' });
    await setup(db);
    const r = await updateField(db, 1, { realisasi: '98', jam: '08:00-16:00', kendala: 'Setting ulang' }, 'Budi');
    const row = (await db.execute({ sql: `SELECT * FROM jurnal_harian_produksi WHERE id = 1` })).rows[0];
    console.log('\n📋 Test 1: Edit realisasi');
    check('update success', r.success);
    check('realisasi = 98', Number(row.realisasi) === 98);
    check('jam = 08:00-16:00', row.jam === '08:00-16:00');
    check('kendala = Setting ulang', row.kendala === 'Setting ulang');
    check('updated_by = Budi', row.updated_by === 'Budi');
    check('updated_at terisi', !!row.updated_at);
    db.close();
  }

  // ─── Test 2: Edit empty fields (fill realisasi for record 3) ───
  {
    const db = createClient({ url: 'file::memory:' });
    await setup(db);
    await updateField(db, 3, { realisasi: '180', jam: '07:00-15:00' }, 'Cahyo');
    const row = (await db.execute({ sql: `SELECT * FROM jurnal_harian_produksi WHERE id = 3` })).rows[0];
    console.log('\n📋 Test 2: Isi realisasi dari kosong');
    check('realisasi = 180', Number(row.realisasi) === 180);
    check('jam terisi', row.jam === '07:00-15:00');
    check('kendala tetap kosong', row.kendala === '');
    db.close();
  }

  // ─── Test 3: Soft delete ────────────────────────────────────────
  {
    const db = createClient({ url: 'file::memory:' });
    await setup(db);
    await softDelete(db, 2, 'Admin');
    const row = (await db.execute({ sql: `SELECT * FROM jurnal_harian_produksi WHERE id = 2` })).rows[0];
    console.log('\n📋 Test 3: Soft delete');
    check('deleted_at terisi', !!row.deleted_at);
    check('deleted_by = Admin', row.deleted_by === 'Admin');
    db.close();
  }

  // ─── Test 4: parseEditTemplate ──────────────────────────────────
  {
    console.log('\n📋 Test 4: Parse edit template');
    const r = parseEditTemplate(`Realisasi: 100\nKendala: Mesin trouble\nBahan: HVS 70gr`);
    check('realisasi = 100', r.realisasi === '100');
    check('kendala = Mesin trouble', r.kendala === 'Mesin trouble');
    check('bahan_kertas = HVS 70gr', r.bahan_kertas === 'HVS 70gr');
    check('jam tidak ada', !r.jam);

    const r2 = parseEditTemplate('jam: 0700-1500');
    check('parse single field', r2.jam === '0700-1500');

    const r3 = parseEditTemplate('tidak ada field valid');
    check('no valid field = empty', Object.keys(r3).length === 0);
  }

  // ─── Test 5: Empty update ──────────────────────────────────────
  {
    const db = createClient({ url: 'file::memory:' });
    await setup(db);
    const r = await updateField(db, 1, {}, 'Budi');
    console.log('\n📋 Test 5: Empty update');
    check('return error', r.error === 'Tidak ada field yang diubah');
    db.close();
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Hasil: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
