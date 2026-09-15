"use client";

// ponytail: seluruh recharts + helper grafik dikurung di sini agar di-split dari bundle awal halaman
// (dimuat malas via next/dynamic hanya saat panel analitik dibuka).
import { RefreshCw, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export interface PicChartItem {
  name: string;
  fullName?: string;
  BelumDikerjakan: number;
  Selesai: number;
  InProgress: number;
  Cancel: number;
  Total: number;
}

export interface StatusPieItem {
  name: string;
  value: number;
  color: string;
}

const fmtNumber = (n: number) =>
  Number(n).toLocaleString("id-ID", { maximumFractionDigits: 0 });

const STATUS_LEGEND = [
  { name: "BELUM DIKERJAKAN", color: "#64748b" },
  { name: "IN PROGRESS", color: "#0ea5e9" },
  { name: "CANCEL", color: "#f43f5e" },
  { name: "SELESAI", color: "#10b981" },
];

const ChartLegend = ({
  items,
}: {
  items: { name: string; color: string; value?: number }[];
}) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
    {items.map((it) => (
      <span
        key={it.name}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: it.color }}
        />
        {it.name}
        {typeof it.value === "number" && (
          <span className="text-slate-400">({fmtNumber(it.value)})</span>
        )}
      </span>
    ))}
  </div>
);

const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (!percent || percent <= 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const COLOR_MAP: Record<string, string> = {
    "Belum Dikerjakan": "#64748b",
    Selesai: "#10b981",
    "In Progress": "#0284c7",
    Pending: "#f59e0b",
    Cancel: "#f43f5e",
    "BELUM DIKERJAKAN": "#64748b",
    SELESAI: "#10b981",
    "IN PROGRESS": "#0284c7",
    PENDING: "#f59e0b",
    CANCEL: "#f43f5e",
    High: "#f43f5e",
    Medium: "#f59e0b",
    Low: "#3b82f6",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-md text-xs min-w-[120px]">
      {label && (
        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
          {payload[0]?.payload?.fullName || label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const name = entry.name || entry.dataKey;
          let color =
            entry.payload?.color || COLOR_MAP[name] || entry.color || "#6366f1";
          if (typeof color === "string" && color.startsWith("url(")) {
            color = COLOR_MAP[name] || "#6366f1";
          }
          return (
            <div
              key={`tt-${index}`}
              className="flex items-center justify-between gap-3 text-[11px]"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-600 font-medium">{name}:</span>
              </div>
              <span className="font-bold text-slate-800">
                {fmtNumber(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function LaporanPekerjaanCharts({
  picChartData,
  statusPieData,
  loading,
}: {
  picChartData: PicChartItem[];
  statusPieData: StatusPieItem[];
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Bar Chart 1: Beban Kerja per PIC */}
      <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
            <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
            <h3 className="text-xs font-bold text-slate-800 truncate">
              Beban Kerja Per PIC (Status Lengkap)
            </h3>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0 hidden sm:inline">
            Distribution per PIC
          </span>
        </div>

        <div className="h-64 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-600" />{" "}
              Memuat grafik...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={picChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradBelumDikerjakan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#64748b" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="gradSelesai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="gradInProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="gradCancel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: 9, fill: "#475569", fontWeight: 600 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  angle={-25}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => fmtNumber(v)}
                />
                <RechartsTooltip content={CustomTooltip} />
                <Bar
                  dataKey="BelumDikerjakan"
                  fill="url(#gradBelumDikerjakan)"
                  radius={[6, 6, 0, 0]}
                  name="BELUM DIKERJAKAN"
                />
                <Bar
                  dataKey="InProgress"
                  fill="url(#gradInProgress)"
                  radius={[6, 6, 0, 0]}
                  name="IN PROGRESS"
                />
                <Bar
                  dataKey="Cancel"
                  fill="url(#gradCancel)"
                  radius={[6, 6, 0, 0]}
                  name="CANCEL"
                />
                <Bar
                  dataKey="Selesai"
                  fill="url(#gradSelesai)"
                  radius={[6, 6, 0, 0]}
                  name="SELESAI"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <ChartLegend items={STATUS_LEGEND} />
      </div>

      {/* Donut Chart 1: Proporsi Status */}
      <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
            <PieChartIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <h3 className="text-xs font-bold text-slate-800 truncate">
              Proporsi Status Pekerjaan
            </h3>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0 hidden sm:inline">
            Overall Status
          </span>
        </div>

        <div className="h-60 w-full flex items-center justify-center">
          {loading ? (
            <div className="text-slate-400 text-xs flex items-center">
              <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-600" />{" "}
              Memuat grafik...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="gradStatusBelumDikerjakan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#64748b" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="gradStatusSelesai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="gradStatusInProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="gradStatusPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="gradStatusCancel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={40}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {statusPieData.map((entry, index) => {
                    const gradMap: Record<string, string> = {
                      "BELUM DIKERJAKAN": "url(#gradStatusBelumDikerjakan)",
                      SELESAI: "url(#gradStatusSelesai)",
                      "IN PROGRESS": "url(#gradStatusInProgress)",
                      PENDING: "url(#gradStatusPending)",
                      CANCEL: "url(#gradStatusCancel)",
                    };
                    return (
                      <Cell key={`cell-${index}`} fill={gradMap[entry.name] || entry.color} />
                    );
                  })}
                </Pie>
                <RechartsTooltip content={CustomTooltip} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <ChartLegend
          items={statusPieData.map((d) => {
            const total = statusPieData.reduce((acc, x) => acc + x.value, 0);
            const pct = total ? Math.round((d.value / total) * 100) : 0;
            return {
              name: `${d.name} (${pct}%)`,
              color: d.color,
              value: d.value,
            };
          })}
        />
      </div>
    </div>
  );
}
