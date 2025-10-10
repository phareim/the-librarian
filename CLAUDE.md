# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application called "Personal Archive" (originally named "the-librarian") - a personal library for managing web content with AI-powered features. Users can save articles from URLs, have AI extract article metadata, and get AI relevance predictions based on reading history.

## Common Commands

### Development
- `npm run dev` - Start development server on port 9002 with Turbopack
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting
- `npm run typecheck` - Run TypeScript type checking without emitting files

### Genkit (AI Development)
- `npm run genkit:dev` - Start Genkit developer UI (runs once)
- `npm run genkit:watch` - Start Genkit developer UI with watch mode

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router, React Server Components)
- **UI**: Radix UI + Tailwind CSS (shadcn/ui pattern)
- **AI**: Firebase Genkit with Google AI (Gemini 2.0 Flash)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google Sign-In)
- **State**: React Query + TanStack Query Firebase

### Key Directory Structure
```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Main library page (article list)
│   ├── layout.tsx    # Root layout with AuthProvider
│   ├── settings/     # Settings page
│   └── read/[id]/    # Reader view for articles
├── components/
│   ├── articles/     # Article display components
│   ├── forms/        # Form components (add-content-dialog, etc.)
│   ├── layout/       # Layout components (header, sidebar)
│   └── ui/           # Reusable UI primitives (shadcn/ui)
├── context/
│   └── auth-context.tsx  # Firebase auth context provider
├── lib/
│   ├── firebase.ts   # Firebase initialization with getters
│   └── utils.ts      # Utility functions (cn, etc.)
├── ai/
│   ├── genkit.ts     # Genkit AI instance configuration
│   └── flows/        # AI flows (server actions)
│       ├── predict-article-relevance.ts
│       └── extract-article-info-flow.ts
└── types/
    └── index.ts      # Shared TypeScript types
```

### Firebase Integration Pattern

**IMPORTANT**: This app uses lazy Firebase initialization with getter functions to handle missing configuration gracefully:

- `getFirebaseAuth()` - Returns `Auth | null`
- `getFirebaseFirestore()` - Returns `Firestore | null`
- Always check for `null` before using Firebase services
- Configuration is read from `.env.local` with `NEXT_PUBLIC_FIREBASE_*` variables

Example pattern used throughout:
```typescript
const db = getFirebaseFirestore();
if (!db || !user) {
  // Handle gracefully with toast notification
  return;
}
// Safe to use db here
```

### Data Model

**Article** (Firestore collection: `articles`)
- `id` (string) - Firestore document ID
- `userId` (string) - Firebase Auth UID
- `title`, `url`, `summary`, `content` (string)
- `sourceName` (string | null) - Extracted from URL hostname
- `imageUrl` (string | undefined) - Main article image
- `tags` (Tag[]) - Array of tag objects
- `dateAdded` (Timestamp | string) - Server timestamp in Firestore, ISO string in client
- `isRead` (boolean)
- `dataAiHint` (string) - Keywords for placeholder images
- `aiRelevance` (object | null) - `{ score: number, reasoning: string, isLoading?: boolean }`

**Important**: When saving to Firestore:
- Use `serverTimestamp()` for `dateAdded` on new articles
- Convert `aiRelevance.isLoading` (UI state) to exclude from database writes
- Convert Date objects when updating `dateAdded`
- Ensure `content` and `sourceName` use `?? null` to avoid undefined values

### AI Flows (Server Actions)

All AI flows are marked `'use server'` and use Firebase Genkit:

1. **extractArticleInfo** (`src/ai/flows/extract-article-info-flow.ts`)
   - Extracts title, summary, imageUrl, and dataAiHint from a URL
   - Returns validated data with proper error handling
   - Called when user adds article via URL

2. **predictArticleRelevance** (`src/ai/flows/predict-article-relevance.ts`)
   - Scores article relevance (0-1) based on user's reading history
   - Provides reasoning for the score
   - Used for personalized content recommendations

Genkit configuration is in `src/ai/genkit.ts` using model `googleai/gemini-2.0-flash`.

### Authentication Flow

1. User signs in via Google OAuth popup (`src/context/auth-context.tsx`)
2. `AuthContext` provides `{ user, loading, signInWithGoogle, signOutUser }`
3. All article CRUD operations check for authenticated user
4. Articles are filtered by `userId` in Firestore queries

### State Management

- **Articles**: Real-time sync via Firestore `onSnapshot` listener in `src/app/page.tsx`
- **Auth**: Context provider wrapping entire app in `src/app/layout.tsx`
- **Toasts**: shadcn/ui toast system via `useToast` hook
- **Forms**: React Hook Form + Zod validation

### Component Patterns

- All client components use `'use client'` directive
- UI components follow shadcn/ui patterns (Radix UI primitives + Tailwind)
- Form components use React Hook Form with zodResolver
- Real-time data updates handled via Firestore listeners (not manual refetch)

## Development Notes

### When Adding Articles to Firestore

The codebase has evolved to handle edge cases around article creation. When adding articles:

1. Always use `serverTimestamp()` for `dateAdded` field
2. If `dateAdded` is missing/undefined, fallback to `new Date().toISOString()`
3. Remove `aiRelevance.isLoading` before saving (it's UI-only state)
4. Validate that `content` and `sourceName` are either string or null (not undefined)

See `handleAddArticle` in `src/app/page.tsx` for the canonical pattern.

### Firebase Error Handling

All Firestore operations include try-catch with detailed error messages:
- Extract error message and code from FirebaseError
- Show user-friendly toast notifications
- Log full error details to console

### AI Extraction Error Handling

The `extractArticleInfo` flow handles failures gracefully:
- If extraction fails, title will contain "Extraction Failed: ..."
- Summary explains the issue
- imageUrl becomes null
- dataAiHint falls back to "extraction error" or "content error"

## Environment Setup

Required environment variables in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- Google AI API key for Genkit (check Genkit documentation for variable name)

The app will run with warnings if Firebase config is missing, but features will be disabled.

## Recent Bug Fixes

Based on git history, recent issues that were resolved:
- Articles weren't being saved to Firebase (now fixed with proper Firestore integration)
- `dateAdded` field was undefined causing FirebaseError (now uses `serverTimestamp()` with fallback)
- Login functionality was broken (restored with proper auth context implementation)
- Removed unnecessary localStorage article storage code when user is not logged in
