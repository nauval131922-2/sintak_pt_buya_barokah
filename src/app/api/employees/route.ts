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

    const activeFilter = all ? "" : "AND is_active = 1";

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
      try {
          if (queryValue) {
            const ftsMatch = await db.execute({
              sql: "SELECT id FROM employees_fts WHERE employees_fts MATCH ?",
              args: [queryValue]
            });

            if (ftsMatch.rows.length > 0) {
                const ids = ftsMatch.rows.map(r => r.id).join(',');
                sqlData = `SELECT * FROM employees WHERE id IN (${ids}) ${activeFilter} ORDER BY ${sortBy} ${sortDir} LIMIT ? OFFSET ?`;
                sqlTotal = `SELECT COUNT(*) as count FROM employees WHERE id IN (${ids}) ${activeFilter}`;
                argsData = [limit, offset];
                argsTotal = [];
            }
          }

          if (!sqlData) {
            const qPattern = `%${search}%`;
            sqlData = `SELECT * FROM employees WHERE 1=1 ${activeFilter} AND (name LIKE ? OR position LIKE ? OR employee_no LIKE ? OR department LIKE ?) ORDER BY ${sortBy} ${sortDir} LIMIT ? OFFSET ?`;
            sqlTotal = `SELECT COUNT(*) as count FROM employees WHERE 1=1 ${activeFilter} AND (name LIKE ? OR position LIKE ? OR employee_no LIKE ? OR department LIKE ?)`;
            argsData = [qPattern, qPattern, qPattern, qPattern, limit, offset];
            argsTotal = [qPattern, qPattern, qPattern, qPattern];
          }
      } catch {
          // Fallback if FTS table not ready
          const qPattern = `%${search}%`;
          sqlData = `SELECT * FROM employees WHERE 1=1 ${activeFilter} AND (name LIKE ? OR position LIKE ? OR employee_no LIKE ? OR department LIKE ?) ORDER BY ${sortBy} ${sortDir} LIMIT ? OFFSET ?`;
          sqlTotal = `SELECT COUNT(*) as count FROM employees WHERE 1=1 ${activeFilter} AND (name LIKE ? OR position LIKE ? OR employee_no LIKE ? OR department LIKE ?)`;
          argsData = [qPattern, qPattern, qPattern, qPattern, limit, offset];
          argsTotal = [qPattern, qPattern, qPattern, qPattern];
      }
    } else {
      sqlData = `SELECT * FROM employees WHERE 1=1 ${activeFilter} ORDER BY ${sortBy} ${sortDir} LIMIT ? OFFSET ?`;
      sqlTotal = `SELECT COUNT(*) as count FROM employees WHERE 1=1 ${activeFilter}`;
      argsData = [limit, offset];
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
