import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/api-guard';
import db from '@/lib/db';
import {
  getPenonaktifanSettings,
  savePenonaktifanSettings,
  DEFAULT_SETTINGS,
} from '@/lib/penonaktifan-settings';

export const dynamic = 'force-dynamic';

 export async function GET() {
   const gate = await requireApiPermission('produksi_penonaktifan_master');
   if (gate.error) return gate.error;
   try {
     const s = await getPenonaktifanSettings();
     let items: Array<{ kode: string; nama: string }> = [];
     if (s.routine_codes.length > 0) {
       const marks = s.routine_codes.map(() => '?').join(',');
       const r = await db.execute({ sql: `SELECT kode, nama FROM stok_master_barang WHERE kode IN (${marks})`, args: [...s.routine_codes] });
       const nameByKode = new Map((r.rows as Array<Record<string, unknown>>).map((row) => [String(row.kode ?? ''), String(row.nama ?? '')]));
       items = s.routine_codes.map((kode) => ({ kode, nama: nameByKode.get(kode) ?? '' }));
     }
     return NextResponse.json({ success: true, settings: s, routine_items: items, defaults: DEFAULT_SETTINGS });
   } catch (error) {
     const msg = error instanceof Error ? error.message : String(error);
     return NextResponse.json({ success: false, error: msg }, { status: 500 });
   }
 }

export async function POST(req: NextRequest) {
  const gate = await requireApiPermission('produksi_penonaktifan_master');
  if (gate.error) return gate.error;
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Body tidak valid' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const toStrList = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map((x) => String(x ?? ''));
      if (typeof v === 'string') return v.split(',');
      return [];
    };
    const saved = await savePenonaktifanSettings({
      routine_codes: toStrList(b.routine_codes),
      idle_days: typeof b.idle_days === 'number' ? b.idle_days : Number(b.idle_days ?? 7),
    });
    return NextResponse.json({ success: true, settings: saved });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
