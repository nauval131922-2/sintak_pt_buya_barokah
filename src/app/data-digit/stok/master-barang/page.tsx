import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePermission } from '@/lib/permissions';
import MasterBarangClient from './MasterBarangClient';
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "SINTAK | Master Barang",
};

export const dynamic = 'force-dynamic';

export default async function MasterBarangPage() {
  await requirePermission("stok_master_barang");

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Master Barang"
        description={
          <>
            Sinkronisasi daftar Master Stok Barang secara langsung dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#c3RrL21icmc="
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />

      <Suspense fallback={<div className="h-40 bg-white rounded-2xl animate-pulse" />}>
        <MasterBarangClient />
      </Suspense>
    </div>
  );
}
