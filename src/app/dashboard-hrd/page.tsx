import {
  Users,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { Suspense } from "react";
import { requirePermission } from "@/lib/permissions";
import KaryawanStatCard from "./KaryawanStatCard";
import InfractionsTrendChart from "./InfractionsTrendChart";

export const metadata: Metadata = {
  title: "SINTAK | Dashboard HRD",
};

export const dynamic = "force-dynamic";

// ─── Content ──────────────────────────────────────────────────────────────────
async function DashboardContent() {
  return (
    <div className="flex flex-col gap-5 shrink-0">
      {/* Stat Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KaryawanStatCard />
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <div>
          <p className="text-[13px] font-extrabold text-gray-700 tracking-tight">Akses Cepat</p>
          <p className="text-[11px] font-medium text-gray-400 mt-0.5">Menu HRD</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { label: "Data", sub: "Karyawan", href: "/employees", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
            { label: "Catat Kesalahan", sub: "Karyawan", href: "/records", icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-100" },
          ].map((item) => (
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
                <p className="text-[10px] text-gray-400 font-medium leading-tight truncate">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Grafik Tren Kesalahan */}
      <InfractionsTrendChart />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 shrink-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 h-[110px] animate-pulse shadow-sm" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl h-[300px] animate-pulse shadow-sm" />
      <div className="bg-white border border-gray-100 rounded-2xl h-[120px] animate-pulse shadow-sm" />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function DashboardHRD() {
  await requirePermission("hrd_dashboard");
  return (
    <div className="flex flex-col gap-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Dashboard HRD"
        description="Ringkasan data SDM (Sumber Daya Manusia) sistem SINTAK."
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
