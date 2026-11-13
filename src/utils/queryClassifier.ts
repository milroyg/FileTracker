/**
 * Classifies whether a search query represents a File Code or a Subject/Filename.
 * Directly preserves and refines the logic from legacy Search.java:
 * - If alphanumeric (e.g. "WRD-2024-101" or "F123") -> Code
 * - If pure numeric (e.g. "10245") -> Code
 * - If pure alphabetic/text (e.g. "Tender for pump") -> Filename
 */
export type SearchMode = 'CODE' | 'FILENAME';

export function classifySearchQuery(query: string): SearchMode {
  const trimmed = query.trim();
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  const hasDigits = /\d/.test(trimmed);

  // Alphanumeric or pure numeric are file codes
  if ((hasLetters && hasDigits) || (!hasLetters && hasDigits)) {
    return 'CODE';
  }

  // Pure words / descriptive sentences are file titles/subjects
  return 'FILENAME';
}
