import { Suspense } from "react";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/permissions";
import ProduksiSelesaiClient from "./ProduksiSelesaiClient";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "SINTAK | Produksi Selesai",
};

export const dynamic = "force-dynamic";

export default async function ProduksiSelesaiPage() {
  await requirePermission("produksi_selesai");

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Produksi Selesai"
        description={
          <>
            Data produksi yang telah selesai, disinkronisasi dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/#cHJkL3RycHJkX3M="
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
        <ProduksiSelesaiClient />
      </Suspense>
    </div>
  );
}
