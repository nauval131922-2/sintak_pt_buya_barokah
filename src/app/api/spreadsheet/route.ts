import { NextRequest, NextResponse } from "next/server";
import { getSession } from '@/lib/session';
import { getSpreadsheetTasks } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Guard: rute yatim tanpa konsumen jelas — minimal session login
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const gid = searchParams.get("gid") || "DATABASE_REPORT";
    const pic = searchParams.get("pic")?.toLowerCase();
    const status = searchParams.get("status")?.toLowerCase();
    const search = searchParams.get("search")?.toLowerCase();
    const forceRefresh = searchParams.get("refresh") === "true";

    let tasks = await getSpreadsheetTasks(gid, forceRefresh);

    if (pic) {
      tasks = tasks.filter((t) => t.pic.toLowerCase() === pic);
    }

    if (status) {
      tasks = tasks.filter((t) => t.status.toLowerCase() === status);
    }

    if (search) {
      tasks = tasks.filter(
        (t) =>
          t.task.toLowerCase().includes(search) ||
          t.project.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      total: tasks.length,
      data: tasks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
