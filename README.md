# WRD File Tracker - React Native & Expo SDK 57

Modern cross-platform mobile application for the **Water Resources Department, Government of Goa**, migrating from native Android (Java/XML) to **React Native (Expo SDK 57 / React 19 / TypeScript)**.

---

## 🏛 Architecture Overview

| Feature | Legacy Native Android (Java) | React Native (Expo SDK 57) | Optimization Benefit |
| :--- | :--- | :--- | :--- |
| **Directory Storage** | `DBHandler.java` (SQLite `File` table) | **TanStack Query In-Memory Index (`src/services/directoryService.ts`)** | **$O(1)$ instant memory lookups**, zero SQLite bridge overhead, automatic stale-while-revalidate offline caching. |
| **Barcode / QR Scanning** | ZXing `IntentIntegrator` (Android-only) | **`expo-camera` (`CameraView`)** | Native-speed cross-platform barcode engine (AVFoundation on iOS, CameraX on Android) + Taptic/Vibration haptic feedback. |
| **OCR & Subject Capture** | `UCropActivity` + Google MLKit | **`expo-image-picker` (16:4 aspect crop) + MLKit Text Recognition** | Native system cropper on iOS and Android without legacy `requestLegacyExternalStorage` or XML FileProviders. |
| **Network Requests** | `OkHttpClient` & `AsyncTask` | **Axios + HTTPS (`src/api/client.ts`)** | Enforced strict HTTPS (blocking insecure cleartext HTTP), request timeouts, and automatic retry policies. |
| **Search Engine** | `Search.java` (TableLayout) | **`SearchScreen.tsx` + `MovementTimeline.tsx`** | Intelligent query classifier (Code vs Filename) with interactive drilldown back-stack navigation. |
| **Credentials & Auth** | Plaintext `SharedPreferences` | **`expo-secure-store` (`src/services/storageService.ts`)** | Stored in iOS Keychain and Android KeyStore (AES-256 GCM encrypted). |
| **Security & Tamper** | None | **`jail-monkey` (`src/config/security.ts`)** | Hardware root & jailbreak detection protecting government file custody. |

---

## 📂 Project Structure

```text
├── assets/                       # Government & Department logo branding
├── legacy_android/               # Preserved legacy Android Java/Gradle project
├── src/
│   ├── api/
│   │   ├── client.ts             # Axios client with HTTPS enforcement & interceptors
│   │   └── fileTrackerApi.ts     # /scan, /regcode, /searchcode, /searchfile APIs
│   ├── components/
│   │   ├── common/               # CustomButton, CustomInput
│   │   ├── EmployeeSelectModal.tsx # "Mark file to employee" modal with division filter
│   │   ├── RegisterFileModal.tsx   # "New file" subject modal with camera OCR extraction
│   │   └── MovementTimeline.tsx    # Chronological history table (Date, Inward, Marked To)
│   ├── config/
│   │   └── security.ts           # Root/tamper enforcement & security constants
│   ├── hooks/
│   │   └── useDirectory.ts       # TanStack Query directory hook with offline persistence
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # NativeStack Navigator
│   │   └── types.ts              # Strongly-typed screen props
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Department auth + dynamic division picker
│   │   ├── DashboardScreen.tsx   # Action hub: Scan & Search cards
│   │   ├── ScannerScreen.tsx     # Fullscreen CameraView QR/Barcode scanner + torch
│   │   └── SearchScreen.tsx      # Dual search (code/filename) + drilldown
│   ├── services/
│   │   ├── directoryService.ts   # Google Sheets CSV parser & O(1) indexed store
│   │   ├── ocrService.ts         # 16:4 crop & MLKit text recognition
│   │   └── storageService.ts     # SecureStore session manager
│   ├── theme/
│   │   ├── colors.ts             # Goa WRD color palette
│   │   └── typography.ts         # Standard font scaling
│   └── utils/
│       └── queryClassifier.ts    # Alphanumeric vs text classifier
├── App.tsx                       # App entry with Providers & Security check
├── app.json                      # Expo configuration & native permissions
├── .env.example                  # Environment variables template
├── .env                          # Local environment variables (git-ignored)
└── package.json
```

---

## 🔐 Environment Variables

The app uses Expo's standard `EXPO_PUBLIC_` prefix to securely inject configuration at bundle time without hardcoding secrets:

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_BASE_URL` | Goa WRD Backend API URL | `https://goawrd.gov.in/file-tracker` |
| `EXPO_PUBLIC_CSV_DIRECTORY_URL` | Google Sheets CSV Directory URL | `https://docs.google.com/spreadsheets/d/e/...` |
| `EXPO_PUBLIC_ADMIN_SECRET` | Department Administrative Password | `goawrd2000` |

Copy `.env.example` to `.env` to customize values:
```bash
cp .env.example .env
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npx expo start
```

* Press `a` to open in Android Emulator / connected Android device.
* Press `i` to open in iOS Simulator (macOS only).
* Scan the QR code in the Expo Go app.

### 3. Build Production Releases with EAS
```bash
# Android AAB / APK
npx eas build --platform android --profile production

# iOS IPA
npx eas build --platform ios --profile production
```

