import * as XLSX from 'xlsx';
import type { BadgeData } from '../types/badge';

export async function parseAttendees(file: File): Promise<BadgeData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

  const sheetName = workbook.SheetNames.find(
    (n) => n.toLowerCase() === 'attendee_info',
  ) ?? workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet not found in ${file.name}`);

  // header: 1 gives a raw 2D array so we control header → column mapping explicitly
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  if (rows.length < 2) return [];

  const headers = (rows[0] as unknown[]).map(str);

  const idx = (name: string) => headers.indexOf(name);

  const cols = {
    firstName:    idx('First name'),
    lastName:     idx('Last name'),
    attendee2025: idx('2025Attendee'),
    name:         idx('Name'),
    company:      idx('Company'),
    registration: idx('Registration'),
    regTimeCode:  idx('Reg Time Code'),
    attendeeCount:idx('Attendee-count'),
    attendeeDays: idx('Attendee-Days'),
  };

  console.log('[parseAttendees] detected column indices:', cols);

  return rows.slice(1).map((raw) => {
    const r = raw as unknown[];
    const badge: BadgeData = {
      firstName:      str(r[cols.firstName]),
      lastName:       str(r[cols.lastName]),
      company:        str(r[cols.company]),
      is2025Attendee: str(r[cols.attendee2025]).toUpperCase() === 'Y',
      name:           str(r[cols.name]),
      registration:   str(r[cols.registration]),
      regTimeCode:    str(r[cols.regTimeCode]),
      attendeeCount:  str(r[cols.attendeeCount]),
      attendeeDays:   str(r[cols.attendeeDays]),
    };
    console.log('[parseAttendees] row:', badge);
    return badge;
  });
}

function str(v: unknown): string {
  return String(v ?? '').trim();
}
