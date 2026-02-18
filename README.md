# jj-mgmt

A React Native app for Jiu Jitsu school operations, built for both managers and students.

## Vision

`jj-mgmt` is intended to help academies run day-to-day operations while giving students a clear view of classes, progress, and communication.

## Upcoming Features

### Manager Features
- Class schedule creation and management
- Attendance tracking and check-ins
- Student roster and membership status
- Belt promotion tracking and notes
- Basic billing and payment status overview

### Student Features
- View class schedule and book sessions
- Attendance history
- Rank and stripe progression timeline
- In-app announcements from coaches/academy
- Profile and emergency contact management

## Tech Stack

- React Native (Expo)
- TypeScript
- Android + iOS support from a single codebase
- Social auth starter:
  - Google OAuth (Android, iOS, Web)
  - Apple Sign-In (iOS)

## Getting Started

### Prerequisites

- Node.js 18+ (recommended LTS)
- npm
- Expo Go app on device (optional) or Android/iOS simulator

### Install

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

Then set OAuth client IDs in `.env`:

- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_API_BASE_URL` (optional override for backend URL)

API URL defaults:
- Android emulator: `http://10.0.2.2:4000`
- iOS simulator/web: `http://localhost:4000`
- Physical device: set `EXPO_PUBLIC_API_BASE_URL` to your machine LAN IP (for example `http://192.168.1.20:4000`)

### Run

```bash
npm run android
npm run ios
npm run web
```

Notes:
- `npm run ios` requires macOS for the iOS simulator.
- On Windows, use Android emulator/device or Expo Go for local mobile testing.

## Backend (Scaffold)

A starter API is available at `apps/api` (Node.js + TypeScript + Express).

### Backend install

```bash
cd apps/api
npm install
```

### Backend env

```bash
cp .env.example .env
```

### Backend run

```bash
npm run dev
```

Default API URL: `http://localhost:4000`

### Backend tests

```bash
npm test
```

## Contributing

### Workflow

1. Create a branch from `main`
2. Make small, focused changes
3. Open a pull request with a short summary and screenshots for UI changes

### Testing

Run automated tests:

```bash
npm test
```

Also validate contributions by:
- Running the app (`npm run android` or `npm run ios`)
- Checking core flows manually after your change
- Confirming TypeScript compiles without errors

Before opening a pull request, run:
- `npm test`
- `npx tsc --noEmit`

## Social Auth Notes

- Google sign-in is implemented in `App.tsx` using `expo-auth-session`.
- Apple sign-in is available on iOS via `expo-apple-authentication`.
- The app now posts social tokens to backend scaffold routes:
  - `POST /auth/social/google`
  - `POST /auth/social/apple`
- Production still requires server-side token verification and issuing real app sessions/JWTs.
