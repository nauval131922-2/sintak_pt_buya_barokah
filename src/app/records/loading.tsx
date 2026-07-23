import { Loader2 } from 'lucide-react';

export default function Loading() {
  const shimmer = 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-pulse';
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <header className="flex flex-col shrink-0 mb-4 px-2">
        <div className={`h-10 w-64 rounded-full mb-3 ${shimmer}`}></div>
        <div className={`h-4 w-96 rounded-full ${shimmer}`}></div>
      </header>

      <div className="flex-1 bg-white/70 backdrop-blur border border-white/60 rounded-2xl shadow-sm shadow-emerald-900/5 overflow-hidden flex flex-col p-8">
        <div className="flex gap-3 mb-8">
          <div className={`h-12 w-40 rounded-full ${shimmer}`}></div>
          <div className={`h-12 w-40 rounded-full ${shimmer}`}></div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5 space-y-6">
            <div className={`h-64 rounded-2xl border border-white/60 ${shimmer}`}></div>
            <div className={`h-32 rounded-2xl border border-white/60 ${shimmer}`}></div>
          </div>
          <div className="col-span-7">
            <div className={`h-full rounded-2xl border border-white/60 min-h-[450px] ${shimmer}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
