import { getDashboardSummary, getActivityLogs } from "@/lib/actions";
import {
  ShieldCheck, Users, ClipboardList,
  RefreshCw, Calculator,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import ActivityTable from "@/components/ActivityTable";
import PageHeader from "@/components/PageHeader";
import UsersStatCard from "./UsersStatCard";
import { Suspense } from "react";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Dashboard Umum",
};

export const dynamic = "force-dynamic";

// ─── Stat + Quick Links ───────────────────────────────────────────────────────
async function DashboardStats() {
  // getDashboardSummary masih dipakai meski hanya untuk infractionsThisMonth (tidak ditampilkan di card)
  // tetap call agar tidak breaking jika nanti dipakai lagi
  await getDashboardSummary();

  const quickLinks = [
    {
      label: "Sinkronisasi",
      sub: "All Data",
      href: "/sync",
      icon: RefreshCw,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Hak Akses",
      sub: "Manajemen Role",
      href: "/roles",
      icon: ShieldCheck,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      label: "Kelola User",
      sub: "Manajemen User",
      href: "/users",
      icon: Users,
      color: "text-violet-600 bg-violet-50 border-violet-100",
    },
    {
      label: "HPP Kalkulasi",
      sub: "Konversi Data",
      href: "/settings/konversi-data/kalkulasi/hpp-kalkulasi",
      icon: Calculator,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "SOPd & Jurnal",
      sub: "Konversi Data",
      href: "/settings/konversi-data/jurnal-harian-produksi",
      icon: ClipboardList,
      color: "text-green-600 bg-green-50 border-green-100",
    },
  ];

  return (
    <div className="flex flex-col gap-5 shrink-0">
      {/* 1 Stat Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UsersStatCard />
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <div>
          <p className="text-[13px] font-extrabold text-gray-700 tracking-tight">Akses Cepat</p>
          <p className="text-[11px] font-medium text-gray-400 mt-0.5">Menu Administrasi</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
                <p className="text-[10px] text-gray-400 font-medium leading-tight truncate">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
async function DashboardLogs() {
  const logs = await getActivityLogs(500);
  return <ActivityTable initialLogs={logs} />;
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="flex flex-col gap-5 shrink-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 h-[110px] animate-pulse shadow-sm" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl h-[120px] animate-pulse shadow-sm" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function Home() {
  await requirePermission("dashboard");
  return (
    <div className="flex flex-col gap-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Dashboard Umum"
        description="Ringkasan operasional harian sistem SINTAK – produksi, SDM, dan aktivitas sistem."
      />

      <Suspense fallback={<StatSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="h-[600px] flex flex-col">
        <Suspense
          fallback={
            <div className="h-full bg-white border border-gray-100 rounded-2xl animate-pulse shadow-sm" />
          }
        >
          <DashboardLogs />
        </Suspense>
      </div>
    </div>
  );
}
