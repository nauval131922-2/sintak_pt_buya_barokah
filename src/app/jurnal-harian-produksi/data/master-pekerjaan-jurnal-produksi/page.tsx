import MasterPekerjaanJurnalProduksiClient from "./MasterPekerjaanJurnalProduksiClient";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";
import { getLastMasterPekerjaanJurnalProduksiImport } from "@/lib/actions";
import { formatLastUpdate } from "@/lib/date-utils";

export const metadata: Metadata = {
  title: "SINTAK | Master Pekerjaan Jurnal Produksi",
};

export const dynamic = "force-dynamic";

export default async function MasterPekerjaanJurnalProduksiPage() {
  await requirePermission("produksi_jhp_master_pekerjaan_jurnal_produksi");
  const lastImport = await getLastMasterPekerjaanJurnalProduksiImport();

  let importFileName = "";
  let importTime = "";

  if (lastImport) {
    try {
      const raw = JSON.parse(lastImport.raw_data as string);
      importFileName = raw.fileName || "";
      importTime = formatLastUpdate(lastImport.created_at as string);
    } catch {
      console.warn("Failed to parse Master Pekerjaan Jurnal Produksi import metadata");
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Master Pekerjaan Jurnal Produksi"
        description="Kelola daftar bagian pekerjaan dan nama pekerjaan/mesin untuk Jurnal Harian Produksi."
      />
      <MasterPekerjaanJurnalProduksiClient 
        importInfo={
          importFileName
            ? { fileName: importFileName, time: importTime }
            : undefined
        }
      />
    </div>
  );
}
