export interface SpreadsheetTask {
  id?: number;
  task: string;
  project: string;
  division: string;
  bagian?: string;
  pic: string;
  priority: string;
  startDate: string;
  endDate: string;
  status: string;
  workDays?: string;
  note?: string;
}

export const SPREADSHEET_ID = "1T-qLsKYGRd1R2DqbKyosmeubxIZ7q5tR0cpjfmx4Rmc";

export const SHEET_GIDS: Record<string, string> = {
  SETTING: "12298478",
  MoM: "1467433465",
  PROJECT: "1790281677",
  TASK_MANAGER: "1503027465",
  DASHBOARD: "591841132",
  CALENDAR: "310388925",
  DATABASE_REPORT: "816921157",
  DATABASE_DASHBOARD: "302408576",
  Albila: "1655860248",
  Soni: "1186011856",
  Rifan: "1708761174",
  Adi: "1063288850",
  Eric: "2046535703",
  Rikza: "177177253",
  BUDGET_SUMMARY: "1488831449",
};

/**
 * Parses a CSV raw string into array of array of strings
 */
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentField.trim());
      lines.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    lines.push(currentRow);
  }

  return lines;
}

// Simple in-memory cache for fast instant responses (< 5ms)
let cachedTasks: { data: SpreadsheetTask[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30 detik TTL

/**
 * Fetches live data from Google Spreadsheet by GID or Sheet Name
 */
export async function getSpreadsheetTasks(
  gidOrName: string = "DATABASE_REPORT",
  forceRefresh: boolean = false
): Promise<SpreadsheetTask[]> {
  const now = Date.now();
  if (!forceRefresh && cachedTasks && now - cachedTasks.timestamp < CACHE_TTL_MS) {
    return cachedTasks.data;
  }

  const gid = SHEET_GIDS[gidOrName] || gidOrName;
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    if (cachedTasks) return cachedTasks.data; // Fallback to cache if network fails
    throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length <= 1) return [];

  const tasks: SpreadsheetTask[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 2 && (row[1] || row[2])) {
      tasks.push({
        task: row[1] || row[2] || "",
        project: row[2] || "",
        division: row[3] || "",
        pic: row[4] || "",
        priority: row[5] || "",
        startDate: row[6] || "",
        endDate: row[7] || "",
        workDays: row[8] || "",
        note: row[11] || "",
        status: row[12] || "BELUM DIKERJAKAN",
      });
    }
  }

  cachedTasks = { data: tasks, timestamp: now };
  return tasks;
}
