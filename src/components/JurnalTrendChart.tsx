'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

interface JurnalTrendChartProps {
  data: { date: string; count: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-[12px]">
      <p className="font-bold text-gray-500 mb-0.5">Tgl {label}</p>
      <p className="font-extrabold text-green-600">{payload[0].value} entri</p>
    </div>
  );
}

export default function JurnalTrendChart({ data }: JurnalTrendChartProps) {
  // Format date untuk label: '2026-05-15' → '15'
  const chartData = data.map(d => ({
    ...d,
    label: d.date.slice(8),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 16, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="colorJurnal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: '#d1d5db' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#colorJurnal)"
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            if (payload.count === 0) return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#e5e7eb" stroke="white" strokeWidth={2} />;
            return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#16a34a" stroke="white" strokeWidth={2} />;
          }}
          activeDot={{ r: 5, fill: '#16a34a', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
