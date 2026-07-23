import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BookOpen, Boxes, ClipboardList, Factory, Package } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import JurnalStatCard from "../dashboard/JurnalStatCard";
import OrdersStatCard from "../dashboard/OrdersStatCard";
import ProduksiTrendChart from "./ProduksiTrendChart";
import JurnalTerbaruCard from "./JurnalTerbaruCard";
import { getProductionDashboardSummary } from "@/lib/actions";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Dashboard Produksi",
};

export const dynamic = "force-dynamic";

type LatestJournal = {
  id: number | string;
  tgl?: string | null;
  shift?: string | number | null;
  nama_karyawan?: string | null;
  no_order?: string | null;
  nama_order?: string | null;
  no_order_2?: string | null;
  nama_order_2?: string | null;
  jenis_pekerjaan?: string | null;
  bagian?: string | null;
  target: number;
  realisasi: number;
  created_at?: string | null;
  recorded_by?: string | null;
  recorded_by_name?: string | null;
  input_at?: string | null;
  action_type?: string | null;
};

type ProductionDashboardSummary = {
  latestJournals: LatestJournal[];
};

const quickLinks = [
  { label: "Order", sub: "Produksi", href: "/orders", icon: ClipboardList, color: "text-blue-600 bg-blue-50 border-blue-100" },
  { label: "Bahan Baku", sub: "Produksi", href: "/bahan-baku", icon: Boxes, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
  { label: "Barang", sub: "Jadi", href: "/barang-jadi", icon: Package, color: "text-orange-600 bg-orange-50 border-orange-100" },
  { label: "Jurnal Harian", sub: "Produksi", href: "/jurnal-harian-produksi", icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { label: "Detail Hasil", sub: "Produksi", href: "/hasil-produksi", icon: Factory, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
];

async function DashboardProductionContent() {
  const s = (await getProductionDashboardSummary()) as ProductionDashboardSummary;

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards: Order Produksi, Jurnal Produksi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OrdersStatCard />
        <JurnalStatCard />
      </div>

      {/* Akses Cepat — di atas grafik */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div>
          <p className="text-[13px] font-extrabold text-gray-700 tracking-tight">Akses Cepat</p>
          <p className="text-[11px] font-medium text-gray-400 mt-0.5">Menu operasional produksi</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-150"
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-700 leading-tight truncate">{item.label}</p>
                <p className="text-[11px] text-gray-400 font-medium leading-tight truncate">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Grafik Tren BBB & Hasil Produksi */}
      <ProduksiTrendChart />

      {/* Jurnal Terbaru — client component dengan auto-refresh */}
      <JurnalTerbaruCard initialData={s.latestJournals} />
    </div>
  );
}

function DashboardProductionSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl h-[110px] animate-pulse shadow-sm" />
        <div className="bg-white border border-gray-100 rounded-2xl h-[110px] animate-pulse shadow-sm" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl h-[80px] animate-pulse shadow-sm" />
      <div className="bg-white border border-gray-100 rounded-2xl h-[300px] animate-pulse shadow-sm" />
      <div className="bg-white border border-gray-100 rounded-2xl h-[320px] animate-pulse shadow-sm" />
    </div>
  );
}

export default async function DashboardManufakturPage() {
  await requirePermission("produksi_dashboard");

  return (
    <div className="flex flex-col gap-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Dashboard Produksi"
        description="Ringkasan jurnal, order, bahan baku, dan barang jadi produksi."
      />

      <Suspense fallback={<DashboardProductionSkeleton />}>
        <DashboardProductionContent />
      </Suspense>
    </div>
  );
}
