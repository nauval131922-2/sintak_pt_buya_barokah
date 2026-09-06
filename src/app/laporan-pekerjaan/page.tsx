import LaporanPekerjaanClient from "./LaporanPekerjaanClient";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { getUserMergedLaporanPekerjaanConfig } from "@/lib/permissions-laporan-pekerjaan";

export const metadata: Metadata = {
  title: "Laporan Pekerjaan",
};

export default async function LaporanPekerjaanPage() {
  await requirePermission("produksi_laporan_pekerjaan");

  const session = await getSession();
  const userRoles = session?.roles || (session?.role ? [session.role] : []);

  let linkedEmployeeName: string | undefined;
  if (session?.userId) {
    try {
      const db = (await import("@/lib/db")).default;
      const res = await db.execute({
        sql: `SELECT COALESCE(e.name, u.name) as emp_name
              FROM users u
              LEFT JOIN employees e ON e.id = u.employee_id
              WHERE u.id = ?`,
        args: [session.userId],
      });
      if (res.rows.length > 0 && res.rows[0].emp_name) {
        linkedEmployeeName = String(res.rows[0].emp_name);
      }
    } catch (_) {}
  }

  const roleConfig = await getUserMergedLaporanPekerjaanConfig(userRoles, {
    name: session?.name,
    username: session?.username,
    employeeName: linkedEmployeeName,
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col laporan-pekerjaan-page-root">
      <PageHeader
        title="Laporan Pekerjaan"
        description="Monitoring & Laporan Pekerjaan Produksi SINTAK"
      />
      <LaporanPekerjaanClient roleConfig={roleConfig} />
    </div>
  );
}
