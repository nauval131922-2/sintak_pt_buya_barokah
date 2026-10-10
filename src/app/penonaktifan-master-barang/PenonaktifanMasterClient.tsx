'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Play, AlertTriangle, CheckCircle2, Search, Settings2, X, Plus, Trash2, Save } from 'lucide-react';

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
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal cutoff</label>
          <input
            type="date"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          Generate usulan
        </button>
        <button
          onClick={handleExport}
          disabled={!data || exporting}
          className="h-9 px-4 inline-flex items-center gap-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Unduh Excel usulan
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="h-9 px-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50"
        >
          <Settings2 size={16} />
          Pengaturan
        </button>
        {data && (
          <div className="ml-auto relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari kode / nama…"
              className="h-9 pl-8 pr-3 rounded-lg border border-gray-300 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
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
          <p className="text-[11px] text-gray-400">
            File usulan saja — tidak mengubah status master. Eksekusi nonaktif tetap di Digit oleh Dhea.
            Saldo 0 di sintak diasumsikan N PERSD 0; pastikan sync master terbaru sebelum eksekusi.
          </p>
        </>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">Pengaturan penonaktifan</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>
            {settingsLoading || !settings ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <Loader2 size={20} className="inline animate-spin mr-1" /> Memuat pengaturan…
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Kata kunci produk rutin (cocok di nama barang)</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {settings.routine_keywords.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        {kw}
                        <button
                          onClick={() => setSettings({ ...settings, routine_keywords: settings.routine_keywords.filter((x) => x !== kw) })}
                          className="hover:text-emerald-900"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                    {settings.routine_keywords.length === 0 && <span className="text-xs text-gray-400">Belum ada — semua nama lolos.</span>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={kwInput}
                      onChange={(e) => setKwInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && kwInput.trim()) {
                          setSettings({ ...settings, routine_keywords: [...settings.routine_keywords, kwInput.trim().toLowerCase()] });
                          setKwInput('');
                        }
                      }}
                      placeholder="cth: tafsir jalalain"
                      className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => {
                        if (!kwInput.trim()) return;
                        setSettings({ ...settings, routine_keywords: [...settings.routine_keywords, kwInput.trim().toLowerCase()] });
                        setKwInput('');
                      }}
                      className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Kode rutin eksplisit (tetap dilindungi walau nama umum)</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {settings.routine_codes.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-mono font-semibold">
                        {c}
                        <button
                          onClick={() => setSettings({ ...settings, routine_codes: settings.routine_codes.filter((x) => x !== c) })}
                          className="hover:text-blue-900"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                    {settings.routine_codes.length === 0 && <span className="text-xs text-gray-400">Belum ada.</span>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && codeInput.trim()) {
                          setSettings({ ...settings, routine_codes: [...settings.routine_codes, codeInput.trim()] });
                          setCodeInput('');
                        }
                      }}
                      placeholder="cth: 260500057"
                      inputMode="numeric"
                      className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => {
                        if (!codeInput.trim()) return;
                        setSettings({ ...settings, routine_codes: [...settings.routine_codes, codeInput.trim()] });
                        setCodeInput('');
                      }}
                      className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Batas idle penawaran batal (hari)</div>
                  <input
                    value={idleInput}
                    onChange={(e) => setIdleInput(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    className="h-9 w-28 px-3 rounded-lg border border-gray-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Penawaran (QO/BOM) yang umurnya di bawah ini tidak diusulkan.</p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {settingsSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Simpan pengaturan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
