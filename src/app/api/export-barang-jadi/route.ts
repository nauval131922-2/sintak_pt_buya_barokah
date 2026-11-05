import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/api-guard';
import { logActivity } from '@/lib/activity';
import {
  fetchBarangJadiExportRows,
  buildBarangJadiWorkbook,
  type BarangJadiFilterParams,
  type BarangJadiExportMeta,
} from '@/lib/barang-jadi-export';

export const dynamic = 'force-dynamic';

function signerOf(session: { name?: string; username?: string } | null | undefined): string {
  if (session?.name?.trim()) return `(${session.name.trim()})`;
  if (session?.username) return `(${session.username})`;
  return '(PPIC)';
}

export async function GET(request: NextRequest) {
  const gate = await requireApiPermission('produksi_barang_jadi');
  if (gate.error) return gate.error;

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const search = searchParams.get('search') || '';
    const warningOnly = searchParams.get('warning_only') === 'true';
    const soOnly = searchParams.get('so_only') === 'true';

    const filterParams: BarangJadiFilterParams = {
      from: from || undefined,
      to: to || undefined,
      search: search || undefined,
      warningOnly,
      soOnly,
    };

    const rows = await fetchBarangJadiExportRows(filterParams);

    const meta: BarangJadiExportMeta = {
      from: from || undefined,
      to: to || undefined,
      search: search || undefined,
      warningOnly,
      soOnly,
      totalRows: rows.length,
    };

    const buffer = await buildBarangJadiWorkbook(rows, meta, signerOf(gate.session));

    const dateSuffix = from && to ? ` (${from} sd ${to})` : '';
    const filename = `PENERIMAAN BARANG JADI${dateSuffix}.xlsx`;

    logActivity('EXPORT', 'barang_jadi', `Export ${rows.length} baris barang jadi ke Excel (${filename})`).catch(() => {});

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
