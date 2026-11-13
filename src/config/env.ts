/**
 * Build-time configuration. Every EXPO_PUBLIC_* value is inlined into the JS
 * bundle and can be read by anyone with the APK, so nothing secret may live
 * here — the department password is only present as a salted hash.
 *
 * Local builds read .env; EAS builds read the variables registered with
 * `eas env:create` (.env is git-ignored and never uploaded). See README.
 */
export const ENV = {
  /** Goa WRD File Tracker API: /scan, /regcode, /searchcode, /searchfile */
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://goawrd.gov.in/file-tracker',

  /** Published Google Sheets CSV with the Office/Person directory. */
  CSV_DIRECTORY_URL:
    process.env.EXPO_PUBLIC_CSV_DIRECTORY_URL ||
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRnjsCiY_MV7PBvE8qkUjSqSuFrfyAQlpuoDbJ2WsItmd4LmswTjsTkFc-GQ6z2-Uluqn4fOC299enn/pub?gid=1956630541&single=true&output=csv',

  /**
   * SHA-256 hex digest of `${PASSWORD_SALT}${password}` — generate with
   * `npm run hash-password`. Deliberately has no default: without it, login
   * is refused rather than falling back to a known password.
   */
  ADMIN_PASSWORD_HASH: (process.env.EXPO_PUBLIC_ADMIN_PASSWORD_HASH ?? '').trim().toLowerCase(),
};

/** Must match scripts/hash-password.js. */
export const PASSWORD_SALT = 'wrd-filetracker:v1:';
