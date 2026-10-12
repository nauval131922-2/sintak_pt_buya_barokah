import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/api-guard';
import { generateUsulan } from '@/lib/penonaktifan-engine';
import { logActivity } from '@/lib/activity';
import { buildPenonaktifanWorkbook } from '@/lib/penonaktifan-export';
import type { PenonaktifanExportRow } from '@/lib/penonaktifan-export';

export const dynamic = 'force-dynamic';

function todayIso(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const y = wib.getFullYear();
  const m = String(wib.getMonth() + 1).padStart(2, '0');
  const d = String(wib.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isCutoff(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function signerOf(session: { name?: string; username?: string } | null | undefined): string {
  if (session?.name?.trim()) return `(${session.name.trim()})`;
  if (session?.username) return `(${session.username})`;
  return '(PPIC)';
}

function cleanRows(
  input: Array<{ kode: string; nama: string; satuan?: string; golongan?: string; kelompok?: string; saldo?: string; alasan?: string }>,
): PenonaktifanExportRow[] {
  return input
    .filter((r) => /^\d+$/.test(String(r?.kode ?? '').trim()))
    .slice(0, 5000)
    .map((r) => ({
      kode: String(r.kode).trim(),
      nama: String(r.nama ?? ''),
      satuan: String(r.satuan ?? ''),
      golongan: String(r.golongan ?? ''),
      kelompok: String(r.kelompok ?? ''),
      saldo: String(r.saldo ?? '0.00'),
      alasan: String(r.alasan ?? ''),
    }));
}

function xlsx(buffer: Buffer, cutoff: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="USULAN NONAKTIF ${cutoff}.xlsx"`,
    },
  });
}

// GET /api/export-penonaktifan-master-barang?cutoff=yyyy-mm-dd — regenerate murni dari server.
// Unduh Excel usulan (11 kolom A-K + footer 3 kolom). Tidak menonaktifkan apa pun.
export async function GET(request: NextRequest) {
  const gate = await requireApiPermission('produksi_penonaktifan_master');
  if (gate.error) return gate.error;
  try {
    const { searchParams } = new URL(request.url);
    const cutoff = searchParams.get('cutoff') || todayIso();
    if (!isCutoff(cutoff)) {
      return NextResponse.json({ success: false, error: 'cutoff harus yyyy-mm-dd' }, { status: 400 });
    }
    const { rows } = await generateUsulan(cutoff);
    const buffer = await buildPenonaktifanWorkbook(cutoff, rows, signerOf(gate.session));
    logActivity('EXPORT', 'stok_master_barang', `Export ${rows.length} baris usulan penonaktifan (cutoff ${cutoff})`).catch(() => {});
    return xlsx(buffer, cutoff);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST — export hasil koreksi client (usul hapus/tambah/manual sudah diterapkan di tabel).
// body: { cutoff, rows: [{ kode, nama, satuan?, golongan?, kelompok?, saldo?, alasan? }] }
export async function POST(request: NextRequest) {
  const gate = await requireApiPermission('produksi_penonaktifan_master');
  if (gate.error) return gate.error;
  try {
    const body = (await request.json()) as {
      cutoff?: string;
      rows?: Array<{ kode: string; nama: string; satuan?: string; golongan?: string; kelompok?: string; saldo?: string; alasan?: string }>;
    };
    const cutoff = String(body.cutoff ?? '');
    if (!isCutoff(cutoff)) {
      return NextResponse.json({ success: false, error: 'cutoff harus yyyy-mm-dd' }, { status: 400 });
    }
    const rows = cleanRows(Array.isArray(body.rows) ? body.rows : []);
    const buffer = await buildPenonaktifanWorkbook(cutoff, rows, signerOf(gate.session));
    logActivity('EXPORT', 'stok_master_barang', `Export ${rows.length} baris usulan penonaktifan terkoreksi (cutoff ${cutoff})`).catch(() => {});
    return xlsx(buffer, cutoff);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
