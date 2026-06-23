import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
