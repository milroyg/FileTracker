/**
 * Application Environment Configuration
 * Uses Expo's built-in EXPO_PUBLIC_ prefix to securely expose environment variables
 * to the mobile bundle across development, staging, and EAS production builds.
 */

export const ENV = {
  /**
   * Base URL for the Goa Water Resources Department (WRD) File Tracker API endpoints:
   * /scan, /regcode, /searchcode, /searchfile
   */
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL || 'https://goawrd.gov.in/file-tracker',

  /**
   * Published CSV URL for the dynamic Office/Employee directory
   */
  CSV_DIRECTORY_URL:
    process.env.EXPO_PUBLIC_CSV_DIRECTORY_URL ||
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRnjsCiY_MV7PBvE8qkUjSqSuFrfyAQlpuoDbJ2WsItmd4LmswTjsTkFc-GQ6z2-Uluqn4fOC299enn/pub?gid=1956630541&single=true&output=csv',

  /**
   * Department Master Secret / Administrative Password
   */
  ADMIN_SECRET:
    process.env.EXPO_PUBLIC_ADMIN_SECRET ||
    process.env.EXPO_PUBLIC_ADMIN_PASSWORD ||
    'goawrd2000',
};

