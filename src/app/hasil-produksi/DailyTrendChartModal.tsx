'use client';

import React, { useState } from 'react';
import { TrendingUp, X } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface ChartDataItem {
  date: string;
  displayDate: string;
  gudang: number;
  jurnal: number;
}

interface DailyTrendChartModalProps {
  chartData: ChartDataItem[];
  selectedPekerjaan?: string;
  onClose: () => void;
}

export default function DailyTrendChartModal({
  chartData,
  selectedPekerjaan,
  onClose,
}: DailyTrendChartModalProps) {
  const [hideGudang, setHideGudang] = useState(false);
  const [hideJurnal, setHideJurnal] = useState(false);

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-10 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-white border border-gray-100 rounded-xl shadow-md flex flex-col animate-in zoom-in-95 duration-300 cursor-default overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-gray-800 leading-tight">Tren Produksi Harian</h3>
              <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 mt-1">
                Grafik perbandingan Barang Jadi dan Realisasi Pekerjaan
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-lg bg-white border border-gray-100 shadow-sm hover:bg-red-50 hover:text-red-600 transition-all text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-10 min-h-[300px] sm:min-h-[450px] flex flex-col">
          <div className="mb-6 sm:mb-10 flex flex-wrap gap-4 sm:gap-8 text-[11px] font-bold">
            <button 
              onClick={() => setHideGudang(!hideGudang)}
              className={`flex items-center gap-3 cursor-pointer transition-all hover:opacity-80 ${hideGudang ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="w-5 h-5 rounded-lg border border-blue-100 shadow-sm" style={{ backgroundColor: '#2563eb' }}></div>
              <span className={hideGudang ? 'line-through text-gray-300' : 'text-gray-800'}>Barang Jadi</span>
            </button>
            {selectedPekerjaan && (
              <button 
                onClick={() => setHideJurnal(!hideJurnal)}
                className={`flex items-center gap-3 cursor-pointer transition-all hover:opacity-80 ${hideJurnal ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="w-5 h-5 rounded-lg border border-orange-100 shadow-sm" style={{ backgroundColor: '#f97316' }}></div>
                <span className={hideJurnal ? 'line-through text-gray-300' : 'text-gray-800'}>{selectedPekerjaan}</span>
              </button>
            )}
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorGudang" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorJurnal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  fontSize={10} 
                  fontWeight={700} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', textAnchor: 'end' }}
                  angle={-30}
                  height={80}
                  dy={4}
                  label={{ value: 'Tanggal', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  width={80}
                  fontSize={10} 
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => val.toLocaleString('id-ID')}
                  tick={{ fill: '#9ca3af' }}
                  dx={-10}
                  label={{ value: 'Qty / Realisasi', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10, fontWeight: 700, offset: 0 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #f3f4f6', 
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '12px'
                  }}
                />
                {!hideGudang && (
                  <Area 
                    type="monotone" 
                    dataKey="gudang" 
                    name="Barang Jadi" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorGudang)" 
                    animationDuration={1000}
                  />
                )}
                {!hideJurnal && selectedPekerjaan && (
                  <Area 
                    type="monotone" 
                    dataKey="jurnal" 
                    name={selectedPekerjaan} 
                    stroke="#f97316" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorJurnal)" 
                    animationDuration={1000}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
