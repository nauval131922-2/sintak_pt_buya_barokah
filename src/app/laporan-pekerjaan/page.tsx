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
  const roleConfig = await getUserMergedLaporanPekerjaanConfig(userRoles);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <PageHeader
        title="Laporan Pekerjaan"
        description="Monitoring & Laporan Pekerjaan Produksi SINTAK"
      />
      <LaporanPekerjaanClient roleConfig={roleConfig} />
    </div>
  );
}
