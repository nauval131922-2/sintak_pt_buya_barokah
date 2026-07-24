import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import {
  BookOpenText,
  Factory,
  Landmark,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { requirePermission } from '@/lib/permissions';
import JurnalAkuntansiTerbaru from './JurnalAkuntansiTerbaru';
import WarningBarangJadiCard from './WarningBarangJadiCard';
import db from '@/lib/db';

// ponytail: recharts only when chart mounts
// ponytail: no ssr:false in Server Components (Next 16)
const AkuntingTrendChart = nextDynamic(() => import('./AkuntingTrendChart'), {
  loading: () => <div className="bg-white/80 border border-white/20 rounded-2xl h-[360px] animate-pulse shadow-sm" />,
});

export const metadata: Metadata = {
  title: 'SINTAK | Dashboard Akuntansi',
};

export const dynamic = 'force-dynamic';

const quickLinks = [
  {
    label: 'Rek. Akuntansi',
    sub: 'Master Data',
    href: '/akuntansi/data/rek-akuntansi',
    icon: Landmark,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    label: 'Jurnal Umum',
    sub: 'Laporan Akuntansi',
    href: '/akuntansi/laporan/jurnal-umum',
    icon: BookOpenText,
    color: 'text-violet-600 bg-violet-50 border-violet-100',
  },
  {
    label: 'Tracking Manufaktur',
    sub: 'Produksi',
    href: '/tracking-manufaktur',
    icon: TrendingUp,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    label: 'Hasil Produksi',
    sub: 'Produksi',
    href: '/barang-jadi',
    icon: Factory,
    color: 'text-orange-600 bg-orange-50 border-orange-100',
  },
];

async function getJurnalTerbaru() {
  try {
    const executor = (db as any).client || db;
    if (executor.execute) {
      try {
        await executor.execute(`CREATE TABLE IF NOT EXISTS jurnal_umum (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          faktur TEXT NOT NULL,
          tgl TEXT,
          rekening TEXT,
          keterangan TEXT,
          debit REAL,
          kredit REAL,
          username TEXT,
          create_at TEXT,
          parent_faktur TEXT,
          is_child INTEGER DEFAULT 0,
          child_order INTEGER DEFAULT 0,
          raw_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(faktur, child_order, is_child)
        )`);
      } catch (_) {}
    }

    const result = await db.execute(`
      SELECT
        j.id,
        j.faktur,
        j.tgl,
        j.rekening,
        j.keterangan,
        j.debit,
        j.kredit,
        COALESCE(NULLIF(j.username, ''), p.username) AS username,
        j.create_at,
        CASE
          WHEN CAST(substr(trim(j.rekening), 1, 1) AS INTEGER) BETWEEN 4 AND 9
          THEN 'Laba/Rugi'
          WHEN trim(substr(j.rekening, 1,
            CASE WHEN instr(j.rekening, ' - ') > 0
                 THEN instr(j.rekening, ' - ') - 1
                 ELSE length(j.rekening) END
          )) IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas')
          THEN 'Arus Kas'
          ELSE NULL
        END AS jenis_akun
      FROM jurnal_umum j
      LEFT JOIN jurnal_umum p
        ON p.faktur = j.parent_faktur AND p.is_child = 0
      WHERE j.is_child = 1
        AND (
          CAST(substr(trim(j.rekening), 1, 1) AS INTEGER) BETWEEN 4 AND 9
          OR
          trim(substr(j.rekening, 1,
            CASE WHEN instr(j.rekening, ' - ') > 0
                 THEN instr(j.rekening, ' - ') - 1
                 ELSE length(j.rekening) END
          )) IN (SELECT kode FROM rek_akuntansi WHERE arus_kas = 'Kas')
        )
      ORDER BY j.create_at DESC, j.id DESC
      LIMIT 20
    `);

    return JSON.parse(JSON.stringify(result.rows)) as any[];
  } catch (_) {
    return [];
  }
}

async function DashboardAkuntansiContent() {
  const jurnalTerbaru = await getJurnalTerbaru();

  return (
    <div className="flex flex-col gap-5">
      {/* Card Peringatan Barang Jadi */}
      <WarningBarangJadiCard />

      {/* Akses Cepat */}
      <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-sm">
        <div>
          <p className="text-[13px] font-extrabold text-gray-700 tracking-tight">Akses Cepat</p>
          <p className="text-[11px] font-medium text-gray-400 mt-0.5">Menu operasional akuntansi &amp; keuangan</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
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
                <p className="text-[11px] text-gray-400 font-medium leading-tight truncate">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Grafik Tren Laba/Rugi & Arus Kas */}
      <AkuntingTrendChart />

      {/* Tabel Jurnal Umum Terbaru (L/R & Kas) */}
      <JurnalAkuntansiTerbaru initialData={jurnalTerbaru} />
    </div>
  );
}

function DashboardAkuntansiSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl h-[120px] animate-pulse shadow-sm" />
      <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl h-[100px] animate-pulse shadow-sm" />
      <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl h-[320px] animate-pulse shadow-sm" />
      <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl h-[360px] animate-pulse shadow-sm" />
    </div>
  );
}

export default async function DashboardAkuntansiPage() {
  await requirePermission('akt_dashboard');

  return (
    <div className="flex flex-col gap-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Dashboard Akuntansi"
        description="Ringkasan laba/rugi, arus kas, dan entri jurnal umum terkini."
      />

      <Suspense fallback={<DashboardAkuntansiSkeleton />}>
        <DashboardAkuntansiContent />
      </Suspense>
    </div>
  );
}
