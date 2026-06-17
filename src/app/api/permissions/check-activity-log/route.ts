import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRolePermissions } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.role) {
      return NextResponse.json({ success: true, allowed: false });
    }

    if (session.role === 'Super Admin') {
      return NextResponse.json({ success: true, allowed: true });
    }

    const perms = await getRolePermissions(session.role);
    // User diperbolehkan jika module key 'activity_log_view' bernilai true
    const allowed = perms['activity_log_view'] !== false;

    return NextResponse.json({ success: true, allowed });
  } catch (error) {
    return NextResponse.json({ success: true, allowed: false });
  }
}
