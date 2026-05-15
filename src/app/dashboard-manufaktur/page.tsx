import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CalendarDays,
  ClipboardList,
  Factory,
  Package,
  TrendingUp,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import JurnalTrendChart from "@/components/JurnalTrendChart";
import { getProductionDashboardSummary } from "@/lib/actions";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "SINTAK | Dashboard Produksi",
};

export const dynamic = "force-dynamic";

type TrendPoint = {
  date: string;
  count: number;
};

type TopSection = {
  label: string;
  count: number;
};

type LatestJournal = {
  id: number | string;
  tgl?: string | null;
  shift?: string | number | null;
  nama_karyawan?: string | null;
  no_order?: string | null;
  nama_order?: string | null;
  jenis_pekerjaan?: string | null;
  bagian?: string | null;
  target: number;
  realisasi: number;
};

type ProductionDashboardSummary = {
  jurnalToday: number;
  jurnalThisMonth: number;
  totalOrders: number;
  activeOrdersThisMonth: number;
  finishedGoodsThisMonth: number;
  rawMaterialsThisMonth: number;
  jurnalTrend: TrendPoint[];
  topSections: TopSection[];
  latestJournals: LatestJournal[];
  todayDate: string;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function getMonthName() {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function StatCard({
  title,
  value,
  sub,
  href,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  sub: string;
  href: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
        <ArrowRight
          size={16}
          className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all"
        />
      </div>
      <div className="mt-4">
        <div className="text-2xl font-extrabold text-gray-800 tracking-tight leading-none">
          {value}
        </div>
        <div className="text-[11px] text-gray-500 font-bold mt-2 leading-tight">{title}</div>
        <div className="text-[10px] text-gray-300 font-medium mt-0.5">{sub}</div>
      </div>
    </Link>
  );
}

async function DashboardProductionContent() {
  const s = (await getProductionDashboardSummary()) as ProductionDashboardSummary;
  const monthName = getMonthName();

  const statCards = [
    {
      title: "Jurnal Hari Ini",
      value: formatNumber(s.jurnalToday),
      sub: formatDate(s.todayDate),
      href: "/jurnal-harian-produksi",
      icon: BookOpen,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      title: "Jurnal Bulan Ini",
      value: formatNumber(s.jurnalThisMonth),
      sub: monthName,
      href: "/jurnal-harian-produksi",
      icon: TrendingUp,
      color: "bg-green-50 text-green-600 border-green-100",
    },
    {
      title: "Total Order",
      value: formatNumber(s.totalOrders),
      sub: "terdaftar di sistem",
      href: "/orders",
      icon: ClipboardList,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      title: "Order Aktif",
      value: formatNumber(s.activeOrdersThisMonth),
      sub: "berdasarkan jurnal bulan ini",
      href: "/orders",
      icon: Factory,
      color: "bg-violet-50 text-violet-600 border-violet-100",
    },
    {
      title: "Barang Jadi",
      value: formatNumber(s.finishedGoodsThisMonth),
      sub: "qty masuk bulan ini",
      href: "/barang-jadi",
      icon: Package,
      color: "bg-orange-50 text-orange-600 border-orange-100",
    },
    {
      title: "Bahan Baku",
      value: formatNumber(s.rawMaterialsThisMonth),
      sub: "qty masuk bulan ini",
      href: "/bahan-baku",
      icon: Boxes,
      color: "bg-cyan-50 text-cyan-600 border-cyan-100",
    },
  ];

  const quickLinks = [
    { label: "Jurnal Harian", sub: "Produksi", href: "/jurnal-harian-produksi", icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Order", sub: "Produksi", href: "/orders", icon: ClipboardList, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Hasil", sub: "Produksi", href: "/hasil-produksi", icon: Factory, color: "text-green-600 bg-green-50 border-green-100" },
    { label: "Barang", sub: "Jadi", href: "/barang-jadi", icon: Package, color: "text-orange-600 bg-orange-50 border-orange-100" },
    { label: "Bahan", sub: "Baku", href: "/bahan-baku", icon: Boxes, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm min-h-[260px] flex flex-col">
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Tren Jurnal Produksi
              </p>
              <p className="text-[13px] font-bold text-gray-700 mt-0.5">14 hari terakhir</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
              <CalendarDays size={11} />
              <span>Live</span>
            </div>
          </div>
          <div className="flex-1 min-h-[190px] mt-3">
            <JurnalTrendChart data={s.jurnalTrend} />
          </div>
        </div>

        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Akses Cepat</p>
            <p className="text-[13px] font-bold text-gray-700 mt-0.5">Menu operasional produksi</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-2 mt-4">
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Bagian Teraktif</p>
            <p className="text-[13px] font-bold text-gray-700 mt-0.5">Berdasarkan jurnal bulan ini</p>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {s.topSections.length > 0 ? (
              s.topSections.map((section, index) => (
                <div key={section.label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 text-[11px] font-extrabold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-bold text-gray-700 truncate">{section.label}</p>
                      <p className="text-[11px] font-extrabold text-gray-800">{formatNumber(section.count)}</p>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${Math.max(
                            8,
                            (section.count / Math.max(...s.topSections.map((item) => item.count), 1)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[12px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-4">
                Belum ada jurnal produksi untuk bulan ini.
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Jurnal Terbaru</p>
              <p className="text-[13px] font-bold text-gray-700 mt-0.5">8 entri produksi terakhir</p>
            </div>
            <Link
              href="/jurnal-harian-produksi"
              className="group text-[11px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              Lihat semua
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {s.latestJournals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50 border-y border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tanggal</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bagian</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Realisasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {s.latestJournals.map((journal) => (
                    <tr key={journal.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="text-[12px] font-bold text-gray-700">{formatDate(journal.tgl)}</p>
                        <p className="text-[10px] font-semibold text-gray-400">Shift {journal.shift || "-"}</p>
                      </td>
                      <td className="px-5 py-3 min-w-[210px]">
                        <p className="text-[12px] font-bold text-gray-700 line-clamp-1">
                          {journal.nama_order || journal.no_order || "-"}
                        </p>
                        <p className="text-[10px] font-semibold text-gray-400 line-clamp-1">
                          {journal.jenis_pekerjaan || journal.nama_karyawan || "-"}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex max-w-[160px] truncate text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-2 py-1">
                          {journal.bagian || "Tanpa Bagian"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <p className="text-[12px] font-extrabold text-gray-800">
                          {formatNumber(journal.realisasi)}
                        </p>
                        <p className="text-[10px] font-semibold text-gray-400">
                          target {formatNumber(journal.target)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 pb-5">
              <div className="text-[12px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-4">
                Belum ada jurnal produksi yang tercatat.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardProductionSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-white border border-gray-100 rounded-2xl h-[136px] animate-pulse shadow-sm" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 bg-white border border-gray-100 rounded-2xl h-[260px] animate-pulse shadow-sm" />
        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl h-[260px] animate-pulse shadow-sm" />
      </div>
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
