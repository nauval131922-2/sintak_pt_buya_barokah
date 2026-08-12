import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { buildFtsQuery } from "@/lib/fts";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    const all = searchParams.get("all") === "true";

    const activeFilter = all ? "" : "AND e.is_active = 1";

    const sortByParam = searchParams.get("sortBy") || "id";
    const sortDirParam = searchParams.get("sortDir") || "asc";

    const allowedSortColumns = ["id", "name", "position", "department", "employee_no", "is_active"];
    const sortBy = allowedSortColumns.includes(sortByParam) ? sortByParam : "id";
    const sortDir = sortDirParam.toLowerCase() === "desc" ? "DESC" : "ASC";

    let sqlData = "";
    let sqlTotal = "";
    let argsData: unknown[] = [];
    let argsTotal: unknown[] = [];

    if (search) {
      const queryValue = buildFtsQuery(search);
      // ponytail: JOIN FTS + LIMIT — no unbounded id IN (...)
      try {
        if (queryValue) {
          sqlData = `SELECT e.* FROM employees e
            JOIN employees_fts fts ON e.id = fts.rowid
            WHERE employees_fts MATCH ? ${activeFilter}
            ORDER BY e.${sortBy} ${sortDir}
            LIMIT ? OFFSET ?`;
          sqlTotal = `SELECT COUNT(*) as count FROM employees e
            JOIN employees_fts fts ON e.id = fts.rowid
            WHERE employees_fts MATCH ? ${activeFilter}`;
          argsData = [queryValue, limit, offset];
          argsTotal = [queryValue];
        }

        if (!sqlData) {
          const qPattern = `%${search}%`;
          sqlData = `SELECT * FROM employees e WHERE 1=1 ${activeFilter} AND (e.name LIKE ? OR e.position LIKE ? OR e.employee_no LIKE ? OR e.department LIKE ?) ORDER BY e.${sortBy} ${sortDir} LIMIT ? OFFSET ?`;
          sqlTotal = `SELECT COUNT(*) as count FROM employees e WHERE 1=1 ${activeFilter} AND (e.name LIKE ? OR e.position LIKE ? OR e.employee_no LIKE ? OR e.department LIKE ?)`;
          argsData = [qPattern, qPattern, qPattern, qPattern, limit, offset];
          argsTotal = [qPattern, qPattern, qPattern, qPattern];
        }
      } catch {
        const qPattern = `%${search}%`;
        sqlData = `SELECT * FROM employees e WHERE 1=1 ${activeFilter} AND (e.name LIKE ? OR e.position LIKE ? OR e.employee_no LIKE ? OR e.department LIKE ?) ORDER BY e.${sortBy} ${sortDir} LIMIT ? OFFSET ?`;
        sqlTotal = `SELECT COUNT(*) as count FROM employees e WHERE 1=1 ${activeFilter} AND (e.name LIKE ? OR e.position LIKE ? OR e.employee_no LIKE ? OR e.department LIKE ?)`;
        argsData = [qPattern, qPattern, qPattern, qPattern, limit, offset];
        argsTotal = [qPattern, qPattern, qPattern, qPattern];
      }
    } else {
      if (all) {
        sqlData = `SELECT * FROM employees e ORDER BY e.${sortBy} ${sortDir}`;
        argsData = [];
      } else {
        sqlData = `SELECT * FROM employees e WHERE 1=1 ${activeFilter} ORDER BY e.${sortBy} ${sortDir} LIMIT ? OFFSET ?`;
        argsData = [limit, offset];
      }
      sqlTotal = `SELECT COUNT(*) as count FROM employees e WHERE 1=1 ${activeFilter}`;
      argsTotal = [];
    }

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
