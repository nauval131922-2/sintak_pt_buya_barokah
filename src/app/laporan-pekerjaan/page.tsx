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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-8">
      <PageHeader
        title="Laporan Pekerjaan"
        description="Monitoring & Laporan Pekerjaan Produksi dari Google Spreadsheet Live"
      />
      <LaporanPekerjaanClient />
    </div>
  );
}
