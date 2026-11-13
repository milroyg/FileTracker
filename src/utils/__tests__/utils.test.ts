import { parseCsv } from '../csv';
import { formatRelativeTime, parseRecordDate, sortRecordsByLatestDate } from '../dateUtils';
import { classifySearchQuery } from '../queryClassifier';
import { sanitizeSubjectText, validateSubject } from '../subjectValidation';
import { isOnline } from '../network';

describe('parseCsv', () => {
  it('parses plain rows and skips blank lines', () => {
    expect(parseCsv('Office,Person\nD11,Anura\n\nD12,Carol\n')).toEqual([
      ['Office', 'Person'],
      ['D11', 'Anura'],
      ['D12', 'Carol'],
    ]);
  });

  it('keeps commas, quotes and newlines inside quoted fields', () => {
    expect(parseCsv('"Division I (Works), Porvorim","Rao, ""Raj"""\r\n"Multi\nline",x')).toEqual([
      ['Division I (Works), Porvorim', 'Rao, "Raj"'],
      ['Multi\nline', 'x'],
    ]);
  });

  it('strips a UTF-8 BOM', () => {
    expect(parseCsv('﻿a,b')).toEqual([['a', 'b']]);
  });
});

describe('dateUtils', () => {
  it('parses DD-MM-YYYY and YYYY-MM-DD with optional time', () => {
    expect(parseRecordDate('05-03-2024 09:30')).toBe(new Date(2024, 2, 5, 9, 30).getTime());
    expect(parseRecordDate('2024/03/05')).toBe(new Date(2024, 2, 5).getTime());
    expect(parseRecordDate('-')).toBe(0);
    expect(parseRecordDate('garbage')).toBe(0);
  });

  it('sorts newest first without mutating the input', () => {
    const input = [
      { dt: '01-01-2024', username: 'a', employee: 'b' },
      { dt: '02-01-2024', username: 'c', employee: 'd' },
    ];
    expect(sortRecordsByLatestDate(input).map((r) => r.dt)).toEqual(['02-01-2024', '01-01-2024']);
    expect(input[0].dt).toBe('01-01-2024');
  });

  it('formats relative time', () => {
    const now = 1_000_000_000;
    expect(formatRelativeTime(now - 10_000, now)).toBe('just now');
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5 min ago');
    expect(formatRelativeTime(now - 2 * 3_600_000, now)).toBe('2 hrs ago');
    expect(formatRelativeTime(now - 86_400_000, now)).toBe('1 day ago');
  });
});

describe('classifySearchQuery', () => {
  it.each([
    ['1024', 'CODE'],
    ['WRD-2024-101', 'CODE'],
    ['Tender for pump', 'FILENAME'],
  ])('%p -> %s', (query, mode) => {
    expect(classifySearchQuery(query)).toBe(mode);
  });
});

describe('subject validation', () => {
  it('sanitizes markup, formula triggers and whitespace', () => {
    expect(sanitizeSubjectText('  =SUM(A1)  <b>Pump</b>\n\nrepair; ok ')).toBe(
      'SUM(A1) Pump repair ok',
    );
  });

  it('truncates to the maximum length', () => {
    expect(sanitizeSubjectText('a'.repeat(300))).toHaveLength(250);
  });

  it('rejects HTML, empty, short and symbol-only subjects', () => {
    expect(validateSubject('<script>x</script>')).toMatchObject({ ok: false });
    expect(validateSubject('   ')).toMatchObject({ ok: false, title: 'Subject Required' });
    expect(validateSubject('ab')).toMatchObject({ ok: false, title: 'Subject Too Short' });
    expect(validateSubject('!!!???')).toMatchObject({ ok: false, title: 'Invalid Subject' });
  });

  it('accepts a normal subject and returns the cleaned value', () => {
    expect(validateSubject('  Construction of retaining wall  ')).toEqual({
      ok: true,
      value: 'Construction of retaining wall',
    });
  });
});

describe('isOnline', () => {
  it('treats an unknown reachability as online', () => {
    expect(isOnline({ isConnected: true, isInternetReachable: null })).toBe(true);
  });

  it('treats connected-but-unreachable as offline', () => {
    expect(isOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
    expect(isOnline({ isConnected: false, isInternetReachable: null })).toBe(false);
  });
});
