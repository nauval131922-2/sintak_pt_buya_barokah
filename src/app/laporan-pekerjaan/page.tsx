import LaporanPekerjaanClient from "./LaporanPekerjaanClient";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Laporan Pekerjaan",
};

export default async function LaporanPekerjaanPage() {
  await requirePermission("produksi_laporan_pekerjaan");

  return (
    <div className="flex-1 min-h-0 flex flex-col md:overflow-hidden">
      <PageHeader
        title="Laporan Pekerjaan"
        description="Monitoring & Laporan Pekerjaan Produksi SINTAK"
      />
      <LaporanPekerjaanClient />
    </div>
  );
}
