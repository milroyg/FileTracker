/**
 * Minimal RFC 4180 CSV parser: handles quoted fields, commas and newlines
 * inside quotes, escaped quotes (""), and CRLF/LF line endings.
 * Blank lines are skipped.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  // Strip a UTF-8 BOM if the sheet export has one.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const endRow = () => {
    row.push(field);
    if (row.length > 1 || row[0].trim() !== '') rows.push(row);
    row = [];
    field = '';
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      endRow();
    } else if (char === '\r') {
      if (text[i + 1] === '\n') i++;
      endRow();
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) endRow();
  return rows;
}
