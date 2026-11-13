export const SUBJECT_MIN_LENGTH = 3;
export const SUBJECT_MAX_LENGTH = 250;

/**
 * Normalizes OCR or typed subject text before display and submission:
 * strips HTML tags and angle brackets, barcode/shell delimiters, leading
 * spreadsheet-formula triggers (= + - @) and control characters; collapses
 * whitespace; truncates to the maximum length.
 */
export function sanitizeSubjectText(rawText: string, maxLength = SUBJECT_MAX_LENGTH): string {
  if (!rawText) return '';
  return (
    rawText
      .replace(/<[^>]*>/g, '')
      .replace(/[<>;\\`]/g, ' ')
      .replace(/[\r\n\t ]+/g, ' ')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      // After trimming, so leading whitespace can't hide a formula trigger.
      .replace(/^[=+\-@\s]+/, '')
      .slice(0, maxLength)
  );
}

export type SubjectValidation =
  { ok: true; value: string } | { ok: false; title: string; message: string };

const HTML_PATTERN = /<[^>]*>|[<>]|javascript:|on\w+\s*=/i;

/** Validates a file subject; on success returns the sanitized value to submit. */
export function validateSubject(input: string): SubjectValidation {
  if (HTML_PATTERN.test(input)) {
    return {
      ok: false,
      title: 'HTML Not Permitted',
      message:
        'HTML tags, script elements, and angle brackets (< >) are not allowed in file subjects. Please enter plain text only.',
    };
  }

  const value = sanitizeSubjectText(input);
  if (!value) {
    return {
      ok: false,
      title: 'Subject Required',
      message: 'Please enter or scan the full file subject.',
    };
  }
  if (value.length < SUBJECT_MIN_LENGTH) {
    return {
      ok: false,
      title: 'Subject Too Short',
      message: `File subject must be at least ${SUBJECT_MIN_LENGTH} characters long.`,
    };
  }
  if (!/[a-zA-Z0-9]/.test(value)) {
    return {
      ok: false,
      title: 'Invalid Subject',
      message: 'File subject must contain valid letters or numbers.',
    };
  }
  return { ok: true, value };
}
