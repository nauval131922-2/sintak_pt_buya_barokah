import { getDashboardSummary, getActivityLogs } from "@/lib/actions";
import {
  Users, AlertTriangle, ClipboardList, BookOpen,
  ArrowRight, BarChart3, Package, FileText, TrendingUp
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import ActivityTable from "@/components/ActivityTable";
import PageHeader from "@/components/PageHeader";
import JurnalTrendChart from "@/components/JurnalTrendChart";
import { Suspense } from "react";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Dashboard",
};

export const dynamic = "force-dynamic";

// ─── Stat Cards ──────────────────────────────────────────────────────────────
async function DashboardStats() {
  const s = await getDashboardSummary();

  const now = new Date();
  const monthName = now.toLocaleString("id-ID", { month: "long", timeZone: "Asia/Jakarta" });

  const statCards = [
    {
      title: "Jurnal Produksi Hari Ini",
      value: s.jurnalToday,
      sub: "entri tercatat",
      icon: BookOpen,
      iconColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accent: "border-l-emerald-500",
      href: "/jurnal-harian-produksi",
      trend: s.jurnalToday > 0 ? "aktif" : "belum ada",
      trendColor: s.jurnalToday > 0 ? "text-emerald-600 bg-emerald-50" : "text-gray-400 bg-gray-50",
    },
    {
      title: "Jurnal Bulan Ini",
      value: s.jurnalThisMonth.toLocaleString("id-ID"),
      sub: monthName,
      icon: BarChart3,
      iconColor: "bg-green-50 text-green-600 border-green-100",
      accent: "border-l-green-500",
      href: "/jurnal-harian-produksi",
      trend: "total entri",
      trendColor: "text-green-600 bg-green-50",
    },
    {
      title: "Order Produksi",
      value: s.totalOrders.toLocaleString("id-ID"),
      sub: "terdaftar di sistem",
      icon: ClipboardList,
      iconColor: "bg-blue-50 text-blue-600 border-blue-100",
      accent: "border-l-blue-500",
      href: "/orders",
      trend: "database",
      trendColor: "text-blue-600 bg-blue-50",
    },
    {
      title: "Karyawan Aktif",
      value: s.activeEmployees,
      sub: "snapshot sistem",
      icon: Users,
      iconColor: "bg-violet-50 text-violet-600 border-violet-100",
      accent: "border-l-violet-500",
      href: "/employees",
      trend: "aktif",
      trendColor: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <div className="flex flex-col gap-5 shrink-0">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group bg-white border border-gray-100 border-l-4 ${card.accent} rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${card.iconColor}`}>
                <card.icon size={17} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.trendColor}`}>
                {card.trend}
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-gray-800 tracking-tight leading-none">
                {card.value}
              </div>
              <div className="text-[11px] text-gray-400 font-semibold mt-1.5 leading-none">{card.title}</div>
              <div className="text-[10px] text-gray-300 font-medium mt-0.5">{card.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Baris ke-2: Sparkline + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Chart — 2 kolom */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tren Jurnal Produksi</p>
              <p className="text-[13px] font-bold text-gray-700 mt-0.5">7 Hari Terakhir</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
              <TrendingUp size={10} />
              <span>Live</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <JurnalTrendChart data={s.jurnalTrend} />
          </div>
        </div>

        {/* Quick Links — 3 kolom */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Akses Cepat</p>
            <p className="text-[13px] font-bold text-gray-700 mt-0.5">Menu Utama</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Jurnal Harian", sub: "Produksi", href: "/jurnal-harian-produksi", icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
              { label: "Order", sub: "Produksi", href: "/orders", icon: ClipboardList, color: "text-blue-600 bg-blue-50 border-blue-100" },
              { label: "Hasil", sub: "Produksi", href: "/hasil-produksi", icon: BarChart3, color: "text-green-600 bg-green-50 border-green-100" },
              { label: "Barang", sub: "Jadi", href: "/barang-jadi", icon: Package, color: "text-orange-600 bg-orange-50 border-orange-100" },
              { label: "Jurnal", sub: "Umum", href: "/jurnal-umum", icon: FileText, color: "text-purple-600 bg-purple-50 border-purple-100" },
              { label: "Pencatatan", sub: "Kesalahan", href: "/records", icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-100" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-150 text-center"
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.color}`}>
                  <item.icon size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-700 leading-tight">{item.label}</p>
                  <p className="text-[10px] text-gray-400 font-medium leading-tight">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Kesalahan bulan ini — compact bar */}
      {s.infractionsThisMonth > 0 && (
        <Link
          href="/records"
          className="group flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 hover:bg-amber-100 transition-all duration-150 shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
              <AlertTriangle size={15} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-amber-800">
                {s.infractionsThisMonth} kesalahan tercatat bulan ini
              </p>
              <p className="text-[10px] text-amber-600 font-medium">Klik untuk melihat detail pencatatan kesalahan</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 h-[110px] animate-pulse shadow-sm" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl h-[160px] animate-pulse shadow-sm" />
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl h-[160px] animate-pulse shadow-sm" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function Home() {
  await requirePermission("dashboard");
  return (
    <div className="flex flex-col gap-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional harian sistem SINTAK — produksi, SDM, dan aktivitas sistem."
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
