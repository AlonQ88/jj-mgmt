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

## Getting Started

### Prerequisites

- Node.js 18+ (recommended LTS)
- npm
- Expo Go app on device (optional) or Android/iOS simulator

### Install

```bash
npm install
```

### Run

```bash
npm run android
npm run ios
npm run web
```

Notes:
- `npm run ios` requires macOS for the iOS simulator.
- On Windows, use Android emulator/device or Expo Go for local mobile testing.

## Contributing

### Workflow

1. Create a branch from `main`
2. Make small, focused changes
3. Open a pull request with a short summary and screenshots for UI changes

### Testing

This project currently does not have automated tests configured yet.

For now, validate contributions by:
- Running the app (`npm run android` or `npm run ios`)
- Checking core flows manually after your change
- Confirming TypeScript compiles without errors

When tests are added, update this README with exact test commands.
