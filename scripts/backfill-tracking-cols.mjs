/**
 * One-shot backfill denorm tracking columns + indexes.
 * Run: node scripts/backfill-tracking-cols.mjs
 */
import Database from 'better-sqlite3';

const db = new Database(process.env.DB_PATH || 'database.sqlite');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

const cols = [
  ['orders', 'faktur_bom'],
  ['orders', 'faktur_so'],
  ['sph_out', 'faktur_bom'],
  ['bahan_baku', 'faktur_pb'],
];
for (const [t, c] of cols) {
  try {
    db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} TEXT`);
    console.log('added', t, c);
  } catch {
    console.log('exists', t, c);
  }
}

const n1 = db.prepare(`UPDATE orders SET faktur_bom = json_extract(raw_data,'$.faktur_bom') WHERE (faktur_bom IS NULL OR faktur_bom = '') AND raw_data IS NOT NULL`).run();
const n2 = db.prepare(`UPDATE orders SET faktur_so = json_extract(raw_data,'$.faktur_so') WHERE (faktur_so IS NULL OR faktur_so = '') AND raw_data IS NOT NULL`).run();
const n3 = db.prepare(`UPDATE sph_out SET faktur_bom = json_extract(raw_data,'$.faktur_bom') WHERE (faktur_bom IS NULL OR faktur_bom = '') AND raw_data IS NOT NULL`).run();
console.log('orders bom/so', n1.changes, n2.changes, 'sph_out bom', n3.changes);

const rows = db.prepare(`SELECT id, raw_data FROM bahan_baku WHERE (faktur_pb IS NULL OR faktur_pb = '') AND raw_data LIKE '%PB%'`).all();
const upd = db.prepare(`UPDATE bahan_baku SET faktur_pb = ? WHERE id = ?`);
const tx = db.transaction((list) => {
  let n = 0;
  for (const row of list) {
    const seen = new Set();
    const add = (s) => {
      const m = String(s || '').match(/PB\d{8,}/gi);
      if (m) m.forEach((x) => seen.add(x.toUpperCase()));
    };
    try {
      const raw = JSON.parse(row.raw_data || '{}');
      if (raw.hp_detil) {
        try {
          const det = typeof raw.hp_detil === 'string' ? JSON.parse(raw.hp_detil) : raw.hp_detil;
          if (det && typeof det === 'object') {
            for (const [k, v] of Object.entries(det)) {
              add(k);
              if (v && typeof v === 'object' && v.faktur) add(v.faktur);
            }
          } else add(raw.hp_detil);
        } catch {
          add(raw.hp_detil);
        }
      } else add(row.raw_data);
    } catch {
      add(row.raw_data);
    }
    if (seen.size === 0) continue;
    upd.run([...seen].join(','), row.id);
    n++;
  }
  return n;
});
const filled = tx(rows);
console.log('bahan_baku faktur_pb', filled, '/', rows.length);

for (const sql of [
  'CREATE INDEX IF NOT EXISTS idx_orders_faktur_bom ON orders(faktur_bom)',
  'CREATE INDEX IF NOT EXISTS idx_orders_faktur_so ON orders(faktur_so)',
  'CREATE INDEX IF NOT EXISTS idx_sph_out_faktur_bom ON sph_out(faktur_bom)',
  'CREATE INDEX IF NOT EXISTS idx_bahan_baku_faktur_pb ON bahan_baku(faktur_pb)',
  'CREATE INDEX IF NOT EXISTS idx_bahan_baku_fkt_hasil ON bahan_baku(fkt_hasil)',
]) {
  db.exec(sql);
  console.log('index', sql.slice(0, 50));
}

console.log('done', {
  orders_bom: db.prepare(`SELECT COUNT(*) c FROM orders WHERE faktur_bom IS NOT NULL AND faktur_bom != ''`).get().c,
  orders_so: db.prepare(`SELECT COUNT(*) c FROM orders WHERE faktur_so IS NOT NULL AND faktur_so != ''`).get().c,
  sph_bom: db.prepare(`SELECT COUNT(*) c FROM sph_out WHERE faktur_bom IS NOT NULL AND faktur_bom != ''`).get().c,
  bb_pb: db.prepare(`SELECT COUNT(*) c FROM bahan_baku WHERE faktur_pb IS NOT NULL AND faktur_pb != ''`).get().c,
});
db.close();
