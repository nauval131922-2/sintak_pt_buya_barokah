export async function initIndexing(database: { execute: (sql: string) => Promise<unknown> }) {
  console.log('[INDEXING] Initializing Performance Indexes...');
  
  const indexes = [
    // 1. Employees Optimization
    "CREATE INDEX IF NOT EXISTS idx_employees_active_id ON employees(is_active, id);",
    "CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);",
    
    // 2. Infractions Optimization (Crucial for Stats & Filter)
    "CREATE INDEX IF NOT EXISTS idx_infractions_composite_query ON infractions(employee_id, date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_severity_date ON infractions(severity, date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_infractions_faktur_composite ON infractions(faktur, date DESC);",
    
    // 3. Activity Logs Optimization (Dashboard)
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_desc ON activity_logs(created_at DESC);",
    // Index covering untuk ORDER BY created_at DESC, id DESC — hindari TEMP B-TREE RIGHT PART
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_id_desc ON activity_logs(created_at DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_table_action ON activity_logs(table_name, action_type);",
    // Index untuk correlated subquery / GROUP BY record_id per table+action
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_table_action_record ON activity_logs(table_name, action_type, record_id, id);",
    // Index untuk copy-jadwal check: WHERE action_type = 'COPY_JADWAL' AND raw_data LIKE 'prefix%'
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_action_rawdata ON activity_logs(action_type, raw_data);",
    // Index covering untuk filter DISTINCT (table_name, action_type, recorded_by)
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_table_name ON activity_logs(table_name);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_recorded_by ON activity_logs(recorded_by);",
    // Index composite untuk trend query: GROUP BY date(created_at), action_type
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_trend ON activity_logs(created_at, action_type);",
    // Index untuk STATS GROUP BY action_type + WHERE date range — hindari temp B-tree
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created ON activity_logs(action_type, created_at);",
    // Index untuk STATS GROUP BY table_name + WHERE date range
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_table_created ON activity_logs(table_name, created_at DESC);",
    // Index untuk STATS GROUP BY recorded_by + WHERE date range
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_recorded_by_created ON activity_logs(recorded_by, created_at DESC);",
    // Index untuk activity_logs_archive (sama seperti activity_logs)
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_created_at ON activity_logs_archive(created_at DESC);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_table_action ON activity_logs_archive(table_name, action_type);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_table_action_record ON activity_logs_archive(table_name, action_type, record_id, id);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_action_rawdata ON activity_logs_archive(action_type, raw_data);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_table_name ON activity_logs_archive(table_name);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_action_type ON activity_logs_archive(action_type);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_recorded_by ON activity_logs_archive(recorded_by);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_trend ON activity_logs_archive(created_at, action_type);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_action_created ON activity_logs_archive(action_type, created_at);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_table_created ON activity_logs_archive(table_name, created_at DESC);",
    "CREATE INDEX IF NOT EXISTS idx_actlogs_arch_recorded_by_created ON activity_logs_archive(recorded_by, created_at DESC);",

    // 4. Large Data Tables (Digit Sync)
    "CREATE INDEX IF NOT EXISTS idx_orders_faktur ON orders(faktur);",
    "CREATE INDEX IF NOT EXISTS idx_orders_tgl ON orders(tgl);",
    "CREATE INDEX IF NOT EXISTS idx_orders_tgl_iso ON orders(substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2));",
    "CREATE INDEX IF NOT EXISTS idx_bahan_baku_faktur_prd ON bahan_baku(faktur_prd);",
    // Expression index untuk konversi tanggal DD/MM/YYYY di dashboard query
    "CREATE INDEX IF NOT EXISTS idx_bahan_baku_tgl_iso ON bahan_baku(substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2));",
    "CREATE INDEX IF NOT EXISTS idx_barang_jadi_tgl_iso ON barang_jadi(substr(tgl,7,4)||'-'||substr(tgl,4,2)||'-'||substr(tgl,1,2));",
    "CREATE INDEX IF NOT EXISTS idx_barang_jadi_faktur_prd ON barang_jadi(faktur_prd);",
    "CREATE INDEX IF NOT EXISTS idx_barang_jadi_nama_prd ON barang_jadi(nama_prd);",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_faktur ON sales_reports(faktur);",
    
    // Index untuk dashboard query: WHERE tgl = ? AND deleted_at IS NULL
    "CREATE INDEX IF NOT EXISTS idx_jurnal_tgl_deleted ON jurnal_harian_produksi(tgl, deleted_at);",
    // Index untuk distinct active orders per bulan
    "CREATE INDEX IF NOT EXISTS idx_jurnal_tgl_no_order ON jurnal_harian_produksi(tgl, no_order);",
    "CREATE INDEX IF NOT EXISTS idx_jurnal_tgl_no_order_2 ON jurnal_harian_produksi(tgl, no_order_2);",

    // 4b. Jurnal Harian Produksi Optimization
    "CREATE INDEX IF NOT EXISTS idx_jurnal_no_order ON jurnal_harian_produksi(no_order);",
    "CREATE INDEX IF NOT EXISTS idx_jurnal_no_order_2 ON jurnal_harian_produksi(no_order_2);",
    // Composite index for main query: WHERE tgl BETWEEN ? AND ? + bagian/nama filter
    "CREATE INDEX IF NOT EXISTS idx_jurnal_tgl_asc ON jurnal_harian_produksi(tgl ASC);",
    "CREATE INDEX IF NOT EXISTS idx_jurnal_tgl_bagian ON jurnal_harian_produksi(tgl, bagian);",
    "CREATE INDEX IF NOT EXISTS idx_jurnal_tgl_nama_karyawan ON jurnal_harian_produksi(tgl, nama_karyawan);",
    "CREATE INDEX IF NOT EXISTS idx_jurnal_filter_composite ON jurnal_harian_produksi(bagian, jenis_pekerjaan);",
    "CREATE INDEX IF NOT EXISTS idx_jurnal_bagian_pekerjaan_2 ON jurnal_harian_produksi(bagian, jenis_pekerjaan_2);",
    // Full-text search support columns
    "CREATE INDEX IF NOT EXISTS idx_jurnal_nama_karyawan ON jurnal_harian_produksi(nama_karyawan);",
    "CREATE INDEX IF NOT EXISTS idx_jurnal_karyawan_bagian ON jurnal_harian_produksi(nama_karyawan, bagian);",
    "CREATE INDEX IF NOT EXISTS idx_jurnal_bagian ON jurnal_harian_produksi(bagian);",
    // Index untuk dashboard sorting: COALESCE(updated_at, deleted_at, created_at) DESC
    "CREATE INDEX IF NOT EXISTS idx_jurnal_updated_at ON jurnal_harian_produksi(updated_at DESC);",
    "CREATE INDEX IF NOT EXISTS idx_jurnal_deleted_at ON jurnal_harian_produksi(deleted_at DESC);",
    // Expression index untuk ORDER BY utama — hindari temp B-tree sort
    "CREATE INDEX IF NOT EXISTS idx_jurnal_main ON jurnal_harian_produksi(tgl ASC, (CASE UPPER(bagian) WHEN 'SETTING' THEN 1 WHEN 'QUALITY CONTROL' THEN 2 WHEN 'CETAK' THEN 3 WHEN 'FINISHING' THEN 4 WHEN 'GUDANG' THEN 5 WHEN 'TEKNISI' THEN 6 WHEN 'MESIN' THEN 7 ELSE 8 END) ASC, (CASE WHEN jenis_pekerjaan LIKE '%Koordinasi%' THEN 0 ELSE 1 END) ASC, absensi ASC, id ASC);",

    // Composite index untuk filter bagian + deleted_at + tgl — hindari full scan saat filter bagian tanpa tgl
    "CREATE INDEX IF NOT EXISTS idx_jurnal_bagian_deleted_tgl ON jurnal_harian_produksi(bagian, deleted_at, tgl);",

    // 5. Rekap Pembelian Barang Optimization
    "CREATE INDEX IF NOT EXISTS idx_rekap_pembelian_barang_tgl ON rekap_pembelian_barang(tgl DESC);",
    "CREATE INDEX IF NOT EXISTS idx_rekap_pembelian_barang_faktur ON rekap_pembelian_barang(faktur);",
    
    // 6. Pelunasan Hutang Optimization
    "CREATE INDEX IF NOT EXISTS idx_pelunasan_hutang_tgl ON pelunasan_hutang(tgl DESC);",
    "CREATE INDEX IF NOT EXISTS idx_pelunasan_hutang_faktur ON pelunasan_hutang(faktur);",
    
    // 7. Pelunasan Piutang Optimization
    "CREATE INDEX IF NOT EXISTS idx_pelunasan_piutang_tgl ON pelunasan_piutang(tgl DESC);",
    "CREATE INDEX IF NOT EXISTS idx_pelunasan_piutang_faktur ON pelunasan_piutang(faktur);",
    
    // 8. Pengiriman Optimization
    "CREATE INDEX IF NOT EXISTS idx_pengiriman_tgl ON pengiriman(tgl DESC);",
    "CREATE INDEX IF NOT EXISTS idx_pengiriman_recid ON pengiriman(recid);",
    
    // 9. Tracking Manufaktur Optimization (Critical for Pipeline view)
    "CREATE INDEX IF NOT EXISTS idx_bill_of_materials_faktur_prd ON bill_of_materials(faktur_prd);",
    "CREATE INDEX IF NOT EXISTS idx_sales_orders_faktur_sph ON sales_orders(faktur_sph);",
    "CREATE INDEX IF NOT EXISTS idx_purchase_requests_faktur_prd ON purchase_requests(faktur_prd);",
    "CREATE INDEX IF NOT EXISTS idx_spph_out_faktur_pr ON spph_out(faktur_pr);",
    "CREATE INDEX IF NOT EXISTS idx_sph_in_faktur_spph ON sph_in(faktur_spph);",
    "CREATE INDEX IF NOT EXISTS idx_purchase_orders_faktur_sph ON purchase_orders(faktur_sph);",
    "CREATE INDEX IF NOT EXISTS idx_penerimaan_pembelian_faktur_po ON penerimaan_pembelian(faktur_po);",
    "CREATE INDEX IF NOT EXISTS idx_rekap_pembelian_barang_faktur_po ON rekap_pembelian_barang(faktur_po);",
    "CREATE INDEX IF NOT EXISTS idx_pelunasan_hutang_faktur_pb ON pelunasan_hutang(faktur_pb);",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_faktur_so ON sales_reports(faktur_so);",
    "CREATE INDEX IF NOT EXISTS idx_sales_reports_kd_barang ON sales_reports(kd_barang);",
    "CREATE INDEX IF NOT EXISTS idx_pelunasan_piutang_fkt ON pelunasan_piutang(fkt);",

    // 10. System Optimization
    "ANALYZE;" // Update SQLite statistics for query planner
  ];

  for (const sql of indexes) {
    try {
      await database.execute(sql);
      console.log(`[INDEXING] SUCCESS: ${sql.substring(0, 40)}...`);
    } catch (e) {
      console.error(`[INDEXING] FAILED: ${sql.substring(0, 40)}...`, e);
    }
  }
}
