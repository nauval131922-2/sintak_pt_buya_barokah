import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim();
    const all = searchParams.get("all") === "true";
    const hasLimit = searchParams.has("limit");
    const hasPage = searchParams.has("page");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = Math.max(0, (page - 1) * limit);

    const sortByParam = searchParams.get("sortBy") || "id";
    const sortDirParam = searchParams.get("sortDir") || "asc";

    const allowedSortColumns = ["id", "name", "position", "department", "employee_no", "is_active"];
    const sortBy = allowedSortColumns.includes(sortByParam) ? sortByParam : "id";
    const sortDir = sortDirParam.toLowerCase() === "desc" ? "DESC" : "ASC";

    let whereClause = "WHERE 1=1";
    const whereArgs: unknown[] = [];

    if (!all) {
      whereClause += " AND e.is_active = 1";
    }

    if (search) {
      whereClause += " AND (e.name LIKE ? OR e.position LIKE ? OR e.employee_no LIKE ? OR e.department LIKE ?)";
      const pattern = `%${search}%`;
      whereArgs.push(pattern, pattern, pattern, pattern);
    }

    let sqlData = `SELECT e.* FROM employees e ${whereClause} ORDER BY e.${sortBy} ${sortDir}`;
    const argsData = [...whereArgs];

    if (hasPage || hasLimit) {
      sqlData += " LIMIT ? OFFSET ?";
      argsData.push(limit, offset);
    }

    const sqlTotal = `SELECT COUNT(*) as count FROM employees e ${whereClause}`;
    const argsTotal = [...whereArgs];

    const batchResults = await db.batch([
      { sql: sqlData, args: argsData },
      { sql: sqlTotal, args: argsTotal },
      { sql: "SELECT strftime('%Y-%m-%dT%H:%M:%SZ', MAX(created_at)) as lastUpdated FROM employees", args: [] }
    ], "read");

    const data = batchResults[0].rows;
    const total = Number((batchResults[1].rows[0] as Record<string, unknown> | undefined)?.count ?? 0);
    const lastUpdated = (batchResults[2].rows[0] as Record<string, unknown> | undefined)?.lastUpdated ?? null;

    return NextResponse.json({ success: true, data, total, lastUpdated, page, limit });

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
