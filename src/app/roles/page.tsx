import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAllPermissions } from "@/lib/permissions";
import { getAllRoleLaporanPekerjaanConfigs } from "@/lib/permissions-laporan-pekerjaan";
import RolesContent from "./RolesContent";

export const metadata: Metadata = {
  title: "SINTAK | Hak Akses",
};

export default async function RolesPage() {
  const session = await getSession();

  // Only Super Admin can access this page
  if (!session || session.role !== "Super Admin") {
    redirect("/dashboard?access_denied=1");
  }

  const allPermissions = await getAllPermissions();
  const allLaporanConfigs = await getAllRoleLaporanPekerjaanConfigs();

  const db = (await import('@/lib/db')).default;
  const { rows } = await db.execute('SELECT * FROM app_roles ORDER BY id ASC');

  // Ambil daftar PIC dari employees & laporan_pekerjaan untuk pilihan konfigurasi role
  const empRes = await db.execute("SELECT DISTINCT name FROM employees WHERE is_active = 1 AND name IS NOT NULL AND name != '' ORDER BY name ASC");
  const taskPicRes = await db.execute("SELECT DISTINCT pic FROM laporan_pekerjaan WHERE pic IS NOT NULL AND pic != '' ORDER BY pic ASC");
  
  const picSet = new Set<string>();
  empRes.rows.forEach((r: any) => { if (r.name) picSet.add(String(r.name).trim()); });
  taskPicRes.rows.forEach((r: any) => { if (r.pic) picSet.add(String(r.pic).trim()); });
  const availablePics = Array.from(picSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const configurableRoles = rows.map((r: any) => ({
    name: r.role_name as string,
    description: r.description as string,
    color: r.color as string,
    bg: r.bg as string,
    border: r.border as string,
  }));

  return (
    <RolesContent
      allPermissions={allPermissions}
      customRoles={configurableRoles}
      allLaporanConfigs={allLaporanConfigs}
      availablePics={availablePics}
    />
  );
}











