import { NextRequest, NextResponse } from "next/server";
import { getSpreadsheetTasks } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
