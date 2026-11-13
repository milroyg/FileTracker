import axios from 'axios';
import { ENV } from '../config/env';
import { parseCsv } from '../utils/csv';

export interface DirectoryData {
  divisions: string[];
  employeesByDivision: Record<string, string[]>;
  allEmployees: string[];
}

const byName = (a: string, b: string) => a.localeCompare(b);

/**
 * Builds the division → employees index from the directory CSV
 * (columns "Office" and "Person"; falls back to the first two columns).
 * Throws if the CSV contains no usable rows, so an error page or empty sheet
 * is never cached as the directory.
 */
export function buildDirectory(csvText: string): DirectoryData {
  const rows = parseCsv(csvText);
  if (rows.length === 0) throw new Error('Directory CSV is empty.');

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const officeIndex = header.indexOf('office');
  const personIndex = header.indexOf('person');
  const hasHeader = officeIndex !== -1 && personIndex !== -1;
  const divisionColumn = hasHeader ? officeIndex : 0;
  const employeeColumn = hasHeader ? personIndex : 1;

  const employeesByDivisionSets = new Map<string, Set<string>>();
  const allEmployees = new Set<string>();

  for (const row of hasHeader ? rows.slice(1) : rows) {
    const division = row[divisionColumn]?.trim();
    const employee = row[employeeColumn]?.trim();
    if (!division || !employee) continue;

    allEmployees.add(employee);
    let set = employeesByDivisionSets.get(division);
    if (!set) {
      set = new Set();
      employeesByDivisionSets.set(division, set);
    }
    set.add(employee);
  }

  if (employeesByDivisionSets.size === 0) {
    throw new Error('Directory CSV has no division/employee rows.');
  }

  const divisions = [...employeesByDivisionSets.keys()].sort(byName);
  const employeesByDivision: Record<string, string[]> = {};
  for (const division of divisions) {
    employeesByDivision[division] = [...employeesByDivisionSets.get(division)!].sort(byName);
  }

  return { divisions, employeesByDivision, allEmployees: [...allEmployees].sort(byName) };
}

/**
 * Downloads the Office/Employee directory published from Google Sheets.
 * Errors propagate on purpose: React Query then keeps the last good cached
 * directory instead of overwriting it with the bundled snapshot.
 */
export async function fetchDirectory(): Promise<DirectoryData> {
  const response = await axios.get<string>(ENV.CSV_DIRECTORY_URL, {
    timeout: 15000,
    responseType: 'text',
    headers: { 'Cache-Control': 'no-cache' },
  });
  return buildDirectory(response.data);
}
