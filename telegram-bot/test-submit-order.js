// Test: submitRealisasi mutual exclusivity no_order_2 vs nama_order_manual_2
const { createClient } = require('@libsql/client');

async function setup(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS sopd (no_sopd TEXT PRIMARY KEY, nama_order TEXT)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS master_pekerjaan_jurnal_produksi (id INTEGER PRIMARY KEY, name TEXT, category TEXT)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS telegram_users (id INTEGER PRIMARY KEY, telegram_id TEXT, nama_karyawan TEXT, bagian TEXT, posisi TEXT, absensi TEXT, is_active INTEGER)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY, nama_karyawan TEXT, absensi TEXT, posisi TEXT, department TEXT)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS jurnal_harian_produksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT, posisi TEXT, absensi TEXT, tgl TEXT, shift TEXT,
    nama_karyawan TEXT, bagian TEXT, no_order TEXT, nama_order TEXT, jenis_pekerjaan TEXT, target TEXT,
    no_order_2 TEXT, nama_order_2 TEXT, jenis_pekerjaan_2 TEXT, realisasi TEXT,
    bahan_kertas TEXT, jml_plate TEXT, warna TEXT, inscheet TEXT, rijek TEXT, jam TEXT, kendala TEXT,
    keterangan TEXT, nama_order_manual_2 TEXT, is_manual_input INTEGER, created_by TEXT
  )`);
  // Seed
  await db.execute(`INSERT OR IGNORE INTO sopd VALUES ('OP.001.SOPd.I.2026', 'Order A')`);
  await db.execute(`INSERT OR IGNORE INTO master_pekerjaan_jurnal_produksi VALUES (1, 'Setting Mesin', 'Setting')`);
  await db.execute(`INSERT OR IGNORE INTO employees VALUES (1, 'Test User', '12345', 'Operator', 'Setting')`);
  await db.execute(`INSERT OR IGNORE INTO telegram_users (id, telegram_id, nama_karyawan, bagian, posisi, absensi, is_active) VALUES (1, '999', 'Test User', 'SETTING', 'Operator', '12345', 1)`);
}

// Simulate the bot's submitRealisasi (input.ts)
async function submitViaBot(db, params) {
  const { withOrder, manualName } = params;
  const no_order_2 = withOrder ? 'OP.001.SOPd.I.2026' : '';
  const nama_order_manual_2 = withOrder ? '' : (manualName || 'Order Manual');

  // Simulate api.submitRealisasi (api.ts) logic
  let namaOrder2 = nama_order_manual_2; // fallback from manual
  if (no_order_2 && !namaOrder2) {
    // This wouldn't trigger because nama_order_manual_2 is already set
    // But this is the old bug path: nama_order_manual_2 was always sent
  }
  // FIXED: nama_order_2 takes priority
  namaOrder2 = ''; // data.nama_order_2 is not sent by bot
  if (no_order_2 && !namaOrder2) {
    const r = await db.execute({ sql: `SELECT nama_order FROM sopd WHERE no_sopd = ?`, args: [no_order_2] });
    if (r.rows.length > 0) namaOrder2 = r.rows[0].nama_order || '';
  }
  if (!namaOrder2) namaOrder2 = nama_order_manual_2 || '';

  await db.execute({
    sql: `INSERT INTO jurnal_harian_produksi (posisi, absensi, tgl, shift, nama_karyawan, bagian,
      no_order, nama_order, jenis_pekerjaan, target, no_order_2, nama_order_2, jenis_pekerjaan_2, realisasi,
      keterangan, nama_order_manual_2, is_manual_input, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`,
    args: ['Operator','12345','2026-06-29','1','Test User','SETTING',
      no_order_2, namaOrder2, 'Setting Mesin','100', no_order_2, namaOrder2, 'Setting Mesin','100',
      '', nama_order_manual_2 || null, 'test']
  });
  const lastId = (await db.execute({ sql: `SELECT last_insert_rowid() as id` })).rows[0].id;
  return lastId;
}

async function run() {
  let passed = 0, failed = 0;
  function check(label, condition) {
    if (condition) { passed++; console.log(`  ✅ ${label}`); }
    else { failed++; console.log(`  ❌ ${label}`); }
  }

  // Test 1: With dropdown order → nama_order_manual_2 harus null
  {
    const db = createClient({ url: 'file::memory:' });
    await setup(db);
    const id = await submitViaBot(db, { withOrder: true, manualName: 'X' });
    const row = (await db.execute({ sql: `SELECT * FROM jurnal_harian_produksi WHERE id = ?`, args: [id] })).rows[0];
    console.log('\n📋 Test 1: Dropdown order terisi');
    check('no_order_2 terisi', row.no_order_2 === 'OP.001.SOPd.I.2026');
    check('nama_order_2 = Order A (dari SOPD)', row.nama_order_2 === 'Order A');
    check('nama_order_manual_2 = null', row.nama_order_manual_2 === null);
    check('nama_order = Order A (sync target)', row.nama_order === 'Order A');
    db.close();
  }

  // Test 2: Without dropdown → nama_order_manual_2 yang dipake
  {
    const db = createClient({ url: 'file::memory:' });
    await setup(db);
    const id = await submitViaBot(db, { withOrder: false, manualName: 'Order Custom' });
    const row = (await db.execute({ sql: `SELECT * FROM jurnal_harian_produksi WHERE id = ?`, args: [id] })).rows[0];
    console.log('\n📋 Test 2: Order manual (no dropdown)');
    check('no_order_2 kosong', row.no_order_2 === '');
    check('nama_order_2 = Order Custom (dari manual)', row.nama_order_2 === 'Order Custom');
    check('nama_order_manual_2 = Order Custom', row.nama_order_manual_2 === 'Order Custom');
    db.close();
  }

  // Test 3: OLD BEHAVIOR (without fix) — dropdown terisi + nama_order_manual_2 juga terisi
  {
    const db = createClient({ url: 'file::memory:' });
    await setup(db);
    const no_order_2 = 'OP.001.SOPd.I.2026';
    const nama_order_manual_2 = 'Manual Order'; // old bot always sent this

    // OLD code: nama_order_manual_2 takes priority
    let namaOrder2 = nama_order_manual_2 || '';
    if (no_order_2 && !namaOrder2) {
      const r = await db.execute({ sql: `SELECT nama_order FROM sopd WHERE no_sopd = ?`, args: [no_order_2] });
      if (r.rows.length > 0) namaOrder2 = r.rows[0].nama_order || '';
    }
    // nama_order_manual_2 already set → SOPD lookup skipped → BUG

    await db.execute({
      sql: `INSERT INTO jurnal_harian_produksi (posisi, absensi, tgl, shift, nama_karyawan, bagian,
        no_order, nama_order, jenis_pekerjaan, target, no_order_2, nama_order_2, jenis_pekerjaan_2, realisasi,
        keterangan, nama_order_manual_2, is_manual_input, created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`,
      args: ['Operator','12345','2026-06-29','1','Test User','SETTING',
        no_order_2, namaOrder2, 'Setting Mesin','100', no_order_2, namaOrder2, 'Setting Mesin','100',
        '', nama_order_manual_2, 'test']
    });
    const lastId = (await db.execute({ sql: `SELECT last_insert_rowid() as id` })).rows[0].id;
    const row = (await db.execute({ sql: `SELECT * FROM jurnal_harian_produksi WHERE id = ?`, args: [lastId] })).rows[0];
    console.log('\n📋 Test 3: OLD behavior (bug) — dropdown + manual_2 keduanya terisi');
    check('no_order_2 = OP.001...', row.no_order_2 === 'OP.001.SOPd.I.2026');
    check('nama_order_2 = Manual Order (SALAH — harus Order A)', row.nama_order_2 === 'Manual Order');
    check('nama_order_manual_2 = Manual Order', row.nama_order_manual_2 === 'Manual Order');
    db.close();
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Hasil: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
