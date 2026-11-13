import { MovementRecord } from '../api/fileTrackerApi';

/**
 * Parses a variety of date formats returned by the Goa WRD server into a millisecond timestamp.
 * Supports:
 * - DD-MM-YYYY HH:mm:ss / DD/MM/YYYY HH:mm:ss
 * - DD-MM-YYYY / DD/MM/YYYY
 * - YYYY-MM-DD HH:mm:ss / YYYY/MM/DD HH:mm:ss
 * - YYYY-MM-DD
 * - ISO-8601 strings
 */
export function parseRecordDate(dateStr: string): number {
  if (!dateStr || dateStr === '-') return 0;

  const trimmed = dateStr.trim();

  // Pattern 1: DD-MM-YYYY or DD/MM/YYYY (with optional HH:mm[:ss])
  const dmyMatch = trimmed.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
  );
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const parsed = new Date(year, month, day, hour, min, sec).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  // Pattern 2: YYYY-MM-DD or YYYY/MM/DD (with optional HH:mm[:ss])
  const ymdMatch = trimmed.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
  );
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
    const min = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    const sec = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;
    const parsed = new Date(year, month, day, hour, min, sec).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  // Fallback to standard Date constructor
  const fallback = new Date(trimmed).getTime();
  return isNaN(fallback) ? 0 : fallback;
}

/**
 * Sorts movement records so that the latest (most recent) movement date appears first (descending).
 */
export function sortRecordsByLatestDate(records: MovementRecord[]): MovementRecord[] {
  return [...records].sort((a, b) => {
    const timeA = parseRecordDate(a.dt);
    const timeB = parseRecordDate(b.dt);
    return timeB - timeA; // Descending: newest first
  });
}

/** Short human description of how long ago a timestamp was ("just now", "5 min ago", "2 days ago"). */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
