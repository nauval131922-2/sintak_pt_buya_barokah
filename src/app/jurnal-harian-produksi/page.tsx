import { Suspense } from "react";
import JurnalClient from "./JurnalClient";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { requirePermission, getRolePermissions } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import db from "@/lib/db";

export const metadata: Metadata = {
  title: "SINTAK | Jurnal Harian Produksi",
};

export const dynamic = "force-dynamic";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default async function JurnalHarianPage() {
  await requirePermission("produksi_jhp");

  const session = await getSession();
  const isSuperAdmin = session?.role === 'Super Admin';

  let canInputTarget = isSuperAdmin;
  let canInputRealisasi = isSuperAdmin;
  let canCopyJadwal = isSuperAdmin;

  if (!isSuperAdmin && session?.role) {
    const perms = await getRolePermissions(session.role);
    canInputTarget    = perms['produksi_jhp_penjadwalan'] !== false;
    canInputRealisasi = perms['produksi_jhp_realisasi'] !== false;
    canCopyJadwal     = perms['produksi_jhp_penjadwalan'] !== false; // hanya Admin Penjadwalan

    if (session.role === 'Admin Realisasi') {
      canInputTarget = true;
    }
  }

  // ponytail: server-render initial data untuk skip client fetch pertama (Stalled 19s fix)
  // ceiling: kueri duplikat dengan route.ts; upgrade: shared query builder jika query makin kompleks
  const defaultSort = `ORDER BY
    tgl ASC,
    CASE UPPER(bagian)
      WHEN 'SETTING' THEN 1 WHEN 'QUALITY CONTROL' THEN 2 WHEN 'CETAK' THEN 3
      WHEN 'FINISHING' THEN 4 WHEN 'GUDANG' THEN 5 WHEN 'TEKNISI' THEN 6 WHEN 'MESIN' THEN 7 ELSE 8
    END ASC,
    CASE WHEN jenis_pekerjaan LIKE '%Koordinasi%' THEN 0 ELSE 1 END ASC,
    absensi ASC, id ASC`;

  const today = todayStr();
  const batch = await db.batch([
    { sql: 'SELECT COUNT(*) as total FROM jurnal_harian_produksi WHERE tgl = ? AND deleted_at IS NULL', args: [today] },
    { sql: `SELECT id, posisi, absensi, tgl, shift, nama_karyawan, no_order, nama_order,
      jenis_pekerjaan, keterangan, target, realisasi, no_order_2, nama_order_2,
      jenis_pekerjaan_2, bahan_kertas, jml_plate, warna, inscheet, rijek, jam, kendala, bagian,
      is_manual_input, nama_order_manual, nama_order_manual_2
      FROM jurnal_harian_produksi WHERE tgl = ? AND deleted_at IS NULL ${defaultSort} LIMIT 50`, args: [today] },
    { sql: 'SELECT COALESCE(SUM(COALESCE(CAST(realisasi AS REAL), 0)), 0) as v FROM jurnal_harian_produksi WHERE tgl = ? AND deleted_at IS NULL', args: [today] },
    { sql: 'SELECT COALESCE(SUM(COALESCE(CAST(rijek AS REAL), 0)), 0) as v FROM jurnal_harian_produksi WHERE tgl = ? AND deleted_at IS NULL', args: [today] },
  ], "read");
  // ponytail: JSON parse/stringify flattens BigInt → Number for client component
  const initialData = {
    data: JSON.parse(JSON.stringify(batch[1].rows)),
    total: Number((batch[0].rows[0] as any).total),
    totalRealisasi: Number((batch[2].rows[0] as any).v || 0),
    totalRijek: Number((batch[3].rows[0] as any).v || 0),
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Jurnal Harian Produksi"
        description="Laporan target dan realisasi pekerjaan harian produksi."
      />

      <Suspense fallback={<div className="h-40 bg-white rounded-2xl animate-pulse" />}>
        <JurnalClient
          initData={initialData}
          canInputTarget={canInputTarget}
          canInputRealisasi={canInputRealisasi}
          canCopyJadwal={canCopyJadwal}
          isSuperAdmin={isSuperAdmin}
          userRole={session?.role || ""}
        />
      </Suspense>
    </div>
  );
}




