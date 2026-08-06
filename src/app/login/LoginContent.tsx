'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { KeyRound, User, LogIn, AlertCircle, Printer } from 'lucide-react';

export default function LoginContent() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(username, password);
      if (result.success) {
        router.push(result.firstRoute ?? '/dashboard');
        router.refresh();
      } else {
        setError(result.message || 'Login gagal.');
      }
    } catch (err) {
      setError('Terjadi kesalahan yang tidak terduga.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-hidden flex bg-[var(--bg-deep)] animate-in fade-in duration-700 md:[zoom:0.82] md:w-[121.95vw] md:h-[121.95vh] xl:[zoom:1] xl:w-screen xl:h-screen">
      
      {/* ── Left Panel (Brand) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden flex-col items-center justify-center p-12"
        style={{
          background: 'linear-gradient(145deg, #16a34a 0%, #15803d 40%, #14532d 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center text-white">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-8 shadow-lg">
            <Printer size={38} className="text-white" />
          </div>
          <h1 className="text-6xl font-black tracking-tight leading-none mb-4 drop-shadow-sm">
            SINTAK
          </h1>
          <p className="text-emerald-100 text-sm font-semibold tracking-[0.2em] uppercase mb-12">
            Sistem Informasi Cetak
          </p>

          <div className="w-12 h-0.5 bg-white/30 mx-auto mb-12" />

          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              'Pencatatan dan Analisa Kesalahan Karyawan',
              'Tracking Manufaktur',
              'Target dan Realisasi Produksi',
              'Rekap dan Analisa Hasil Produksi',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-emerald-50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
                <span className="text-sm font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom label */}
        <p className="absolute bottom-8 text-[11px] text-emerald-200/60 font-medium tracking-wide">
          PT. Buya Barokah — Divisi Percetakan
        </p>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 bg-white relative">
        
        {/* Mobile brand header (Pojok Kiri Atas) */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
            <Printer size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-800 leading-none">SINTAK</h1>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              Sistem Informasi Cetak
            </p>
          </div>
        </div>

        {/* Form container */}
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Selamat Datang</h2>
            <p className="mt-1.5 text-sm text-gray-400 font-medium">
              Masuk untuk mengakses SINTAK
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-[12px] animate-in slide-in-from-top-2 duration-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div className="group">
              <label className="text-xs font-bold text-gray-500 tracking-wide mb-2 block">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all text-gray-700 placeholder:text-gray-300"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="text-xs font-bold text-gray-500 tracking-wide mb-2 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound size={16} className="text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all text-gray-700 placeholder:text-gray-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 flex items-center justify-center gap-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={17} />
                  <span>Masuk Sekarang</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-[11px] text-gray-300 font-medium tracking-wide lg:hidden">
            &copy; {new Date().getFullYear()} PT. Buya Barokah &mdash; Divisi Percetakan
          </p>
        </div>
      </div>

    </div>
  );
}
