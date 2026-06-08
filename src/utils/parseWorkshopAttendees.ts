import * as XLSX from 'xlsx';
import type { WorkshopBadgeData } from '../types/workshopBadge';

// Replace non-breaking spaces (U+00A0) with regular spaces, then trim + lowercase
function normalizeHeader(v: unknown): string {
  return String(v ?? '').replace(/ /g, ' ').trim().toLowerCase();
}

// Replace non-breaking spaces and trim answer values from cells
function str(v: unknown): string {
  return String(v ?? '').replace(/ /g, ' ').trim();
}

export async function parseWorkshopAttendees(file: File): Promise<WorkshopBadgeData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet not found in ${file.name}`);

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  if (rows.length < 2) return [];

  const headers = (rows[0] as unknown[]).map(normalizeHeader);

  const q1Idx = headers.findIndex(h => h.startsWith('i am part of'));
  const q3Idx = headers.findIndex(h => h.startsWith('if i was a chart'));
  const q4Idx = headers.findIndex(h => h.startsWith('when it comes to data visualization'));

  // Q2: "I consider myself a(n)..." (Early Bird / Night Owl) — starts with "i consider myself"
  // Q5: "When it comes to data viz, I consider myself a(n)" — starts with "when it comes to data viz"
  // Different prefixes, so they resolve independently.
  const q2Idx = headers.findIndex(h => h.startsWith('i consider myself a(n)'));
  const q5Idx = headers.findIndex(h => h.startsWith('when it comes to data viz, i consider myself'));

  console.log('[parseWorkshopAttendees] column indices:', { q1Idx, q2Idx, q3Idx, q4Idx, q5Idx });

  return rows.slice(1).map((raw) => {
    const r = raw as unknown[];
    const comfortRaw = r[q4Idx];
    const comfortScore = typeof comfortRaw === 'number'
      ? comfortRaw
      : parseInt(String(comfortRaw ?? ''), 10) || 0;

    const badge: WorkshopBadgeData = {
      orgType:      str(r[q1Idx]),
      schedule:     str(r[q2Idx]),
      chartType:    str(r[q3Idx]),
      comfortScore: Math.max(0, Math.min(10, comfortScore)),
      role:         str(r[q5Idx]),
    };
    console.log('[parseWorkshopAttendees] row:', badge);
    return badge;
  });
}
