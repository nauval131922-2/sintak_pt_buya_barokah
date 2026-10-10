import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from '@/lib/permissions';
import PageHeader from "@/components/PageHeader";
import SaldoBarangClient from './SaldoBarangClient';

export const metadata: Metadata = {
  title: "SINTAK | Saldo Barang",
};

export const dynamic = 'force-dynamic';

export default async function SaldoBarangPage() {
  await requirePermission("stok_saldo_barang");
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Saldo Barang"
        description={
          <>
            Posisi saldo dan N persediaan per tanggal dari{" "}
            <a
              href="https://buyapercetakan.mdthoster.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline font-bold"
            >
              Digit
            </a>
          </>
        }
      />
      <Suspense fallback={<div className="h-40 bg-white rounded-2xl animate-pulse" />}>
        <SaldoBarangClient />
      </Suspense>
    </div>
  );
}
