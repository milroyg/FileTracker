# WRD File Tracker

Mobile app for the **Water Resources Department, Government of Goa** to track the movement of
physical files: scan a file's barcode, record who it was handed to, register new files (with OCR
of the file subject), and search a file's movement history.

Built with **Expo SDK 57 · React Native 0.86 (New Architecture) · React 19 · TypeScript (strict)**.
It replaces the earlier native Android app (Java), which is preserved at the git tag
`legacy-android-archive`.

---

## Getting started

Requirements: Node 22+, npm, and an Android/iOS device or emulator. The app uses native modules
(MLKit OCR, jail-monkey, in-app updates), so it runs in a **development build**, not Expo Go.

```bash
npm ci                              # install exact locked dependencies
cp .env.example .env                # then fill in the values (see below)
npx eas build --profile development --platform android   # once, or after native changes
npm start                           # start Metro and open the dev build
```

## Environment variables

All variables are `EXPO_PUBLIC_*`, which means they are **compiled into the app bundle and readable
by anyone who has the APK**. Never put a secret here.

| Variable                          | Purpose                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_BASE_URL`        | File Tracker API (`/scan`, `/regcode`, `/searchcode`, `/searchfile`) |
| `EXPO_PUBLIC_CSV_DIRECTORY_URL`   | Published Google Sheets CSV with `Office,Person` columns             |
| `EXPO_PUBLIC_ADMIN_PASSWORD_HASH` | SHA-256 hash of the department password (never the password)         |

Generate the password hash:

```bash
npm run hash-password -- "<new department password>"
```

**`.env` is only used for local builds.** It is git-ignored, so EAS never receives it. Register the
variables for each EAS environment instead:

```bash
npx eas env:create --environment production --name EXPO_PUBLIC_ADMIN_PASSWORD_HASH --value <hash> --visibility sensitive
npx eas env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value <url> --visibility plaintext
npx eas env:create --environment production --name EXPO_PUBLIC_CSV_DIRECTORY_URL --value <url> --visibility plaintext
# repeat with --environment preview / development
```

If `EXPO_PUBLIC_ADMIN_PASSWORD_HASH` is missing, `app.config.js` warns at build time and the login
screen refuses every password.

## Scripts

| Command                 | What it does                                            |
| ----------------------- | ------------------------------------------------------- |
| `npm start`             | Metro bundler for the development build                 |
| `npm run typecheck`     | `tsc --noEmit`                                          |
| `npm run lint`          | ESLint (Expo config + Prettier + project rules)         |
| `npm test`              | Jest unit tests (`jest-expo`)                           |
| `npm run format`        | Prettier, write mode (`format:check` to verify only)    |
| `npm run validate`      | All of the above, as CI runs them                       |
| `npm run check-drift`   | Detect native changes that need a new binary before OTA |
| `npm run hash-password` | Hash a department password for the env variable         |

A pre-commit hook (husky + lint-staged) lints and formats staged files. GitHub Actions
(`.github/workflows/ci.yml`) runs type-check, lint, tests and the format check on every push and
pull request.

## Project structure

```text
App.tsx                      Providers, splash/session restore, integrity gate, status bar
app.config.js                Expo config (version comes from package.json)
src/
  api/
    client.ts                Axios instance; converts failures into ApiError
    errors.ts                ApiError: network failure vs. server error
    fileTrackerApi.ts        Endpoints + strict "Ok" / "File not in System" handling
  components/
    common/                  AppText, AppTextInput, buttons, inputs, dialogs, banners
    scanner/ search/ outbox/ Feature components used by the screens
    EmployeeSelectModal.tsx  "Mark file to employee"
    RegisterFileModal.tsx    "New file" with OCR subject capture
  config/                    env.ts (build-time config), appInfo.ts, bundled directory snapshot
  hooks/                     useDirectory, useFileTracker (React Query), useOutbox, useDialog
  navigation/                Native stack + typed route params
  screens/                   Login, Dashboard, Scanner (+ scannerMachine state machine), Search
  services/                  outbox, directory, auth, storage (SecureStore), OCR, recents
  theme/                     Colours (light/dark), typography, ThemeContext
  utils/                     CSV parser, dates, logger, network, validation
```

## How it works

- **Server state** goes through TanStack Query. Searches are de-duplicated and briefly cached. The
  employee directory is persisted for 7 days. If it has never been downloaded, the snapshot in
  `src/config/fallbackDirectory.json` is used, but it never replaces a downloaded copy.
- **Offline outbox** (`src/services/outboxService.ts`): file movements and registrations made
  without a connection are saved on the device and sent when the app starts, when the
  connection returns, and when the app comes back to the foreground. The queue is only written
  under a lock, and only one sync runs at a time. A movement for an unregistered file stays in
  the queue as "File not registered" until the file is registered. An action that fails 5 times
  is marked "Needs attention". The Dashboard shows the queue, and actions can be retried,
  discarded, or registered from there.
- **Scanner** flow is an explicit state machine (`src/screens/scanner/scannerMachine.ts`), so only
  one dialog or modal is ever on screen and the camera ignores barcodes while one is open.
- **Logging** goes through `src/utils/logger.ts`, which is silent in release builds. `console.*`
  is a lint error everywhere else.
- **Fonts**: every text goes through `AppText` / `AppTextInput` (enforced by ESLint), so device
  font settings can't override Inter.

## Security notes and known limitations

- The department password is checked **on the device** against a salted SHA-256 hash. This keeps
  the plaintext out of the app, but anyone with the APK can still brute-force a weak password
  offline. Use a long password, and rotate it if it leaks.
- **The API has no authentication.** The username is whatever the user typed at login, and
  `/scan` and `/regcode` accept anyone's requests. Real protection needs backend work: a login
  endpoint that issues tokens, a token required on every request, and `POST` instead of `GET`
  for the two write endpoints.
- Rooted/jailbroken devices get a full-screen block (`SecurityBlockScreen`). Development builds
  skip this check.

## Releasing

- **Version**: bump `version` in `package.json`. That is the only place it's set.
- **Build numbers** are managed by EAS (`appVersionSource: remote`, `autoIncrement` in
  production). The Play Store listing already contains the legacy app's versionCode 7, so the
  remote versionCode must be at least 7 before the first upload:
  `npx eas build:version:set -p android` (enter `7`; the next build becomes 8).
- **Builds**: `npx eas build --profile production --platform android|ios`.
- **OTA updates**: `npx eas update --channel production`. `runtimeVersion` uses the fingerprint
  policy, so an update only reaches binaries with matching native code. Run `npm run check-drift`
  first. If it reports drift, ship a new binary before publishing the update.
- **Store updates**: `AppUpdateGate` prompts users when a newer store build exists (Play in-app
  updates on Android, App Store lookup on iOS).
