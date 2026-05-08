import SopdClient from "./SopdClient";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | SOPd",
};

export const dynamic = "force-dynamic";

export default async function SopdPage() {
  await requirePermission("produksi_jhp_sopd");

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="SOPd"
        description="Daftar Order Produksi (SOPd) untuk referensi Jurnal Harian."
      />

      <SopdClient />
    </div>
  );
}











