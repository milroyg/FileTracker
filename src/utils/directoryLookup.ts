import type { DirectoryData } from '../services/directoryService';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Returns the employee's name exactly as written in the directory CSV if they
 * belong to the given division (Office column), otherwise null. Matching
 * ignores case and extra spaces, so stored sessions survive cosmetic edits.
 */
export function findEmployeeInDivision(
  directory: DirectoryData,
  division: string,
  name: string,
): string | null {
  const wantedDivision = normalize(division);
  const divisionKey = Object.keys(directory.employeesByDivision).find(
    (key) => normalize(key) === wantedDivision,
  );
  if (!divisionKey) return null;

  const wantedName = normalize(name);
  return (
    directory.employeesByDivision[divisionKey].find(
      (employee) => normalize(employee) === wantedName,
    ) ?? null
  );
}
