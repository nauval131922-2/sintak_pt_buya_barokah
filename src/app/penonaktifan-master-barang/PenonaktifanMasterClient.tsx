 'use client';
 
 import { useEffect, useState } from 'react';
 import { Download, Loader2, Play, AlertTriangle, AlertCircle, CheckCircle2, Search, Settings2, X, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
 import Portal from '@/components/Portal';
 import TableFooter from '@/components/TableFooter';
 import SearchAndReload from '@/components/SearchAndReload';

interface PreviewRow {
  kode: string;
  nama: string;
  satuan: string;
  kelompok: string;
  kategori: 'A_LUDES' | 'B_BATAL';
  alasan: string;
}

interface PreviewResult {
  success: boolean;
  cutoff: string;
  kandidat: number;
  bolehCount: number;
  ditolakCount: number;
  rows: PreviewRow[];
  idleDays?: number;
  error?: string;
}

interface Settings {
  routine_keywords: string[];
  routine_codes: string[];
  idle_days: number;
}

function todayIso(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  return wib.toISOString().slice(0, 10);
}

const KAT_LABEL: Record<string, string> = {
  A_LUDES: 'A — Ludes Pesanan',
  B_BATAL: 'B — Penawaran Batal',
};

export default function PenonaktifanMasterClient() {
  const [cutoff, setCutoff] = useState(todayIso());
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [saldoInfo, setSaldoInfo] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [kwInput, setKwInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [idleInput, setIdleInput] = useState('7');

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/penonaktifan-master-barang/settings');
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
        setKwInput('');
        setCodeInput('');
        setIdleInput(String(json.settings.idle_days));
      }
    } catch {
      // abaikan, panel tampilkan pesan
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (showSettings && !settings) loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettings]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/penonaktifan-master-barang?cutoff=${cutoff}&limit=5000`);
      const json = (await res.json()) as PreviewResult;
      if (!json.success) throw new Error(json.error || 'Gagal generate');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSaldo = async () => {
    setSyncing(true);
    setSaldoInfo('');
    setError('');
    try {
      const res = await fetch(`/api/scrape-saldo-barang?tgl=${cutoff}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.details || 'Gagal sync saldo');
      setSaldoInfo(`Saldo ${json.tgl}: ${Number(json.total).toLocaleString('id-ID')} kode tersimpan.`);
      setData(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export-penonaktifan-master-barang?cutoff=${cutoff}`);
      if (!res.ok) throw new Error('Gagal export Excel');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `USULAN NONAKTIF ${cutoff}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/penonaktifan-master-barang/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, idle_days: Number(idleInput) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal simpan');
      setSettings(json.settings);
      setIdleInput(String(json.settings.idle_days));
      setData(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSettingsSaving(false);
    }
  };

  const filtered = (data?.rows ?? []).filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return r.kode.toLowerCase().includes(s) || r.nama.toLowerCase().includes(s);
  });

   return (
     <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
       <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
         <div className="flex flex-col gap-4 shrink-0 px-1">
           <div className="flex items-center justify-between gap-4 min-h-[32px] flex-wrap">
             <div className="flex items-center gap-4 flex-wrap">
               <div>
                 <label className="block text-[11px] font-bold text-gray-400 mb-1">Tanggal cutoff</label>
                 <input
                   type="date"
                   value={cutoff}
                   onChange={(e) => setCutoff(e.target.value)}
                   className="h-10 px-3 rounded-lg border border-gray-100 bg-white text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 shadow-sm"
                 />
               </div>
               <div className="flex items-end gap-2 pt-5">
                 <button
                   onClick={handleGenerate}
                   disabled={loading}
                   className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-[12px] font-bold shadow-sm shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden"
                 >
                   <span className="relative z-10 flex items-center gap-2">
                     {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                     Generate usulan
                   </span>
                 </button>
                 <button
                   onClick={handleSyncSaldo}
                   disabled={syncing}
                   className="shrink-0 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 text-[12px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                 >
                   {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                   Sync saldo Digit
                 </button>
                 <button
                   onClick={handleExport}
                   disabled={!data || exporting}
                   className="shrink-0 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 text-[12px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                 >
                   {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                   Unduh Excel usulan
                 </button>
                 <button
                   onClick={() => setShowSettings(true)}
                   className="shrink-0 w-10 h-10 bg-white border border-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all shadow-sm"
                   title="Pengaturan penonaktifan"
                 >
                   <Settings2 size={18} />
                 </button>
               </div>
             </div>
             {data && (
               <div className="w-full sm:w-auto sm:min-w-[220px]">
                 <SearchAndReload searchQuery={q} setSearchQuery={setQ} onReload={handleGenerate} loading={loading} placeholder="Cari kode / nama…" />
               </div>
             )}
           </div>
         </div>
         {saldoInfo && (
           <div className="p-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shadow-sm shadow-emerald-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
             <CheckCircle2 className="w-5 h-5 shrink-0" />
             <p>{saldoInfo}</p>
           </div>
         )}
         {error && (
           <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
             <AlertCircle className="w-5 h-5 shrink-0" />
             <p>{error}</p>
           </div>
         )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Kandidat aktif saldo 0', value: data.kandidat },
              { label: 'Layak diusulkan', value: data.bolehCount },
              { label: 'Ditolak Pilar 2', value: data.ditolakCount },
              { label: 'Cutoff', value: data.cutoff, mono: true },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
                <div className="text-[11px] font-semibold text-gray-500">{s.label}</div>
                <div className={`text-xl font-bold text-gray-800 tabular-nums ${s.mono ? 'text-base font-mono' : ''}`}>
                  {typeof s.value === 'number' ? s.value.toLocaleString('id-ID') : s.value}
                </div>
              </div>
            ))}
          </div>

           <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
           <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-auto">
             <table className="w-full text-sm min-w-[900px]">
               <thead className="sticky top-0 bg-emerald-700 text-white">
                 <tr>
                   <th className="px-3 py-2 text-center font-semibold w-12">No</th>
                   <th className="px-3 py-2 text-center font-semibold w-32">Kode</th>
                   <th className="px-3 py-2 text-left font-semibold">Nama barang</th>
                   <th className="px-3 py-2 text-center font-semibold w-44">Kategori</th>
                   <th className="px-3 py-2 text-left font-semibold">Alasan</th>
                 </tr>
               </thead>
               <tbody>
                 {filtered.map((r, i) => (
                   <tr key={r.kode} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                     <td className="px-3 py-2 text-center tabular-nums text-gray-500">{i + 1}</td>
                     <td className="px-3 py-2 text-center font-mono font-semibold">{r.kode}</td>
                     <td className="px-3 py-2">{r.nama}</td>
                     <td className="px-3 py-2 text-center">
                       <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.kategori === 'A_LUDES' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {KAT_LABEL[r.kategori]}
                       </span>
                     </td>
                     <td className="px-3 py-2 text-gray-600 text-[13px]">{r.alasan}</td>
                   </tr>
                 ))}
                 {filtered.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                       <CheckCircle2 size={20} className="inline mr-1" /> Tidak ada baris — ubah cutoff atau kata kunci.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
           <TableFooter totalCount={data.rows.length} currentCount={filtered.length} label="Usulan" />
           </div>
          <p className="text-[11px] text-gray-400">
            File usulan saja — tidak mengubah status master. Eksekusi nonaktif tetap di Digit oleh Dhea.
            Saldo 0 di sintak diasumsikan N PERSD 0; pastikan sync master terbaru sebelum eksekusi.
          </p>
        </>
      )}
       </div>


      {showSettings && (
 <Portal>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
 <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
 <Settings2 size={18} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-800">Pengaturan penonaktifan</h3>
 <p className="text-[11px] text-slate-500">Kata kunci rutin dan batas idle penawaran</p>
 </div>
 </div>
 <button type="button" onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer">
 <X size={16} />
 </button>
 </div>
 {settingsLoading || !settings ? (
 <div className="py-8 text-center text-gray-400 text-sm">
 <Loader2 size={20} className="inline animate-spin mr-1" /> Memuat pengaturan…
 </div>
 ) : (
 <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
 <div>
 <div className="text-xs font-bold text-slate-700 mb-1.5">Kata kunci produk rutin (cocok di nama barang)</div>
 <div className="flex flex-wrap gap-1.5 mb-2">
 {settings.routine_keywords.map((kw) => (
 <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
 {kw}
 <button onClick={() => setSettings({ ...settings, routine_keywords: settings.routine_keywords.filter((x) => x !== kw) })} className="hover:text-emerald-900">
 <Trash2 size={12} />
 </button>
 </span>
 ))}
 {settings.routine_keywords.length === 0 && <span className="text-xs text-gray-400">Belum ada — semua nama lolos.</span>}
 </div>
 <div className="flex gap-2">
 <input value={kwInput} onChange={(e) => setKwInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && kwInput.trim()) { setSettings({ ...settings, routine_keywords: [...settings.routine_keywords, kwInput.trim().toLowerCase()] }); setKwInput(''); } }} placeholder="cth: tafsir jalalain" className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all" />
 <button onClick={() => { if (!kwInput.trim()) return; setSettings({ ...settings, routine_keywords: [...settings.routine_keywords, kwInput.trim().toLowerCase()] }); setKwInput(''); }} className="px-4 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm shrink-0">
 <Plus size={16} />
 </button>
 </div>
 </div>
 <div>
 <div className="text-xs font-bold text-slate-700 mb-1.5">Kode rutin eksplisit (tetap dilindungi walau nama umum)</div>
 <div className="flex flex-wrap gap-1.5 mb-2">
 {settings.routine_codes.map((c) => (
 <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-mono font-semibold">
 {c}
 <button onClick={() => setSettings({ ...settings, routine_codes: settings.routine_codes.filter((x) => x !== c) })} className="hover:text-blue-900">
 <Trash2 size={12} />
 </button>
 </span>
 ))}
 {settings.routine_codes.length === 0 && <span className="text-xs text-gray-400">Belum ada.</span>}
 </div>
 <div className="flex gap-2">
 <input value={codeInput} onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter' && codeInput.trim()) { setSettings({ ...settings, routine_codes: [...settings.routine_codes, codeInput.trim()] }); setCodeInput(''); } }} placeholder="cth: 260500057" inputMode="numeric" className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all" />
 <button onClick={() => { if (!codeInput.trim()) return; setSettings({ ...settings, routine_codes: [...settings.routine_codes, codeInput.trim()] }); setCodeInput(''); }} className="px-4 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm shrink-0">
 <Plus size={16} />
 </button>
 </div>
 </div>
 <div>
 <div className="text-xs font-bold text-slate-700 mb-1.5">Batas idle penawaran batal (hari)</div>
 <input value={idleInput} onChange={(e) => setIdleInput(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="px-3 py-2 w-28 text-xs tabular-nums bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all" />
 <p className="text-[11px] text-slate-400 mt-1">Penawaran yang umurnya di bawah ini tidak diusulkan.</p>
 </div>
 <button onClick={handleSaveSettings} disabled={settingsSaving} className="w-full flex items-center justify-center gap-2 px-5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm disabled:opacity-60">
 {settingsSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
 Simpan pengaturan
 </button>
 </div>
 )}
 </div>
 </div>
 </Portal>
      )}
    </div>
  );
}
