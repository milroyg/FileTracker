import axios from 'axios';
import { ENV } from '../config/env';
import fallbackDirectory from '../config/fallbackDirectory.json';

const CSV_URL = ENV.CSV_DIRECTORY_URL;

export interface DirectoryData {
  divisions: string[];
  employeesByDivision: Record<string, string[]>;
  allEmployees: string[];
}

/**
 * Downloads and normalizes the Water Resources Department directory from Google Sheets CSV.
 * Replaces legacy DBHandler SQLite database with an instant, O(1) in-memory indexed store.
 * Falls back to bundled snapshot if offline or remote request fails.
 */
export async function fetchAndIndexDirectory(): Promise<DirectoryData> {
  try {
    const response = await axios.get<string>(CSV_URL, {
      timeout: 15000,
      headers: { 'Cache-Control': 'no-cache' },
    });

    const lines = response.data.split('\n');
    const divisionSet = new Set<string>();
    const allEmployeesSet = new Set<string>();
    const divisionMap: Record<string, Set<string>> = {};

    const startIndex = lines[0]?.toLowerCase().includes('office') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const rawLine = lines[i]?.trim();
      if (!rawLine) continue;

      // Format: Office, Person
      const parts = rawLine.split(',');
      if (parts.length >= 2) {
        const division = parts[0]?.trim();
        const employee = parts[1]?.trim();

        if (division && employee) {
          divisionSet.add(division);
          allEmployeesSet.add(employee);

          if (!divisionMap[division]) {
            divisionMap[division] = new Set<string>();
          }
          divisionMap[division].add(employee);
        }
      }
    }

    const sortedDivisions = Array.from(divisionSet).sort((a, b) => a.localeCompare(b));
    const employeesByDivision: Record<string, string[]> = {};

    for (const div of sortedDivisions) {
      employeesByDivision[div] = Array.from(divisionMap[div] ?? []).sort((a, b) =>
        a.localeCompare(b)
      );
    }

    return {
      divisions: sortedDivisions.length > 0 ? sortedDivisions : fallbackDirectory.divisions,
      employeesByDivision:
        Object.keys(employeesByDivision).length > 0
          ? employeesByDivision
          : fallbackDirectory.employeesByDivision,
      allEmployees:
        allEmployeesSet.size > 0
          ? Array.from(allEmployeesSet).sort((a, b) => a.localeCompare(b))
          : fallbackDirectory.allEmployees,
    };
  } catch (error) {
    console.warn('[DirectoryService] Live fetch failed, falling back to bundled directory snapshot:', error);
    return fallbackDirectory as DirectoryData;
  }
}

