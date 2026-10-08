import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/api-guard";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Guard: hanya Super Admin — settings dipakai 20+ rute (last_scrape/period)
  const gate = await requireSuperAdmin();
  if (gate.error) return gate.error;
  try {
    const { key, value } = await request.json();
    if (!key) return NextResponse.json({ error: 'key diperlukan' }, { status: 400 });

    await db.execute({
      sql: `INSERT INTO system_settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      args: [key, value]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
