// Writing CSV without dependencies. Written with semicolons and a BOM, so Excel and Google Sheets open the file
// correctly right away.

type Value = string | number | boolean | null | undefined;

function csvCell(value: Value): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvText(header: string[], rows: Value[][]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
