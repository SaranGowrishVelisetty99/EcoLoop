# EcoLoop Upcycling Engine

A full-stack Next.js 16 app for scanning discarded items, generating AI-powered upcycling blueprints, and tracking sustainability impact with gamification.

## Overview

EcoLoop helps users transform waste into valuable upcycled projects. Users scan items via camera/upload, get AI-generated upcycling blueprints with step-by-step instructions, track project progress, earn points, and compete on a leaderboard.

## Features

- **Authentication**: Firebase Auth (email/password) with protected routes
- **AI Scan Analysis**: NVIDIA NIM vision models analyze images and return structured upcycling blueprints
- **Project Management**: Track projects through states (Saved → In Progress → Completed)
- **Gamification**: Points system (25 pts/scan, 50 pts/completed project) with leaderboard
- **Real-time Dashboard**: Live Firestore listeners for scans, projects, points
- **Delete Operations**: Cascade delete scans (with related projects) or individual projects
- **Account Settings**: Update username synced to Firebase Auth + Firestore

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | Firebase Auth (client) + Firebase Admin (server) |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| AI Vision | NVIDIA NIM (Llama 3.2 Vision, Phi-3 Vision) |
| Styling | Tailwind CSS + Radix UI primitives |
| Language | TypeScript |

## Project Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   /auth     │  │  /dashboard │  │ /dashboard/ │  │ /dashboard/ │       │
│  │  (Sign in/  │  │  (Main UI)  │  │  project/   │  │ leaderboard │       │
│  │   Sign up)  │  │             │  │  [id]       │  │             │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │               │
│         │ Firebase Auth  │ Firestore      │ Firestore      │  /api/        │
│         │ (sign in/up)   │ (real-time)    │ (real-time)    │  leaderboard  │
│         │                │                │                │               │
│         ▼                ▼                ▼                ▼               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FIREBASE CLIENT SDK                              │   │
│  │  auth  •  firestore  •  storage                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ HTTPS / REST
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS SERVER (API Routes)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ /api/scan   │  │/api/award-  │  │/api/scan/   │  │/api/project/│       │
│  │ (POST)      │  │ points      │  │[id] (DEL)   │  │[id] (DEL)   │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │               │
│         ▼                ▼                ▼                ▼               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FIREBASE ADMIN SDK                               │   │
│  │  firestore  •  auth (verify tokens)  •  storage                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ Admin SDK / REST
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   FIREBASE       │  │   NVIDIA NIM     │  │   FIREBASE       │         │
│  │   (Auth,         │  │   (Vision AI     │  │   STORAGE        │         │
│  │   Firestore,     │  │   Inference)     │  │   (Image upload) │         │
│  │   Storage)       │  │                  │  │                  │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication
```
User → /auth page → Firebase Auth (signIn/createUser) → 
  On success: create users/{uid} doc in Firestore → redirect to /dashboard
```

### 2. Scan & Analysis
```
User → /dashboard/scan → upload image → POST /api/scan (with JWT) →
  Server: verify token → call NVIDIA NIM vision API → 
  Parse JSON response → create scans/{scanId} doc → 
  Create userProjects docs (one per suggestion, status: 'saved') →
  Award 25 points → return { scanId, result }
```

### 3. Project Lifecycle
```
User clicks "Start project" → updateStatus('in_progress') → 
User checks all steps → clicks "Mark as complete" → updateStatus('completed') → 
POST /api/award-points → verify project completed & not awarded → 
Atomic transaction: increment user points by 50, mark project.pointsAwarded=true
```

### 4. Real-time Dashboard
```
/dashboard mounts → onSnapshot listeners on:
  - scans (where userId == uid)
  - userProjects (where userId == uid)
  - users/{uid} (points)
UI updates automatically on any Firestore change
```

### 5. Deletion
```
Delete Scan → DELETE /api/scan/{id} → verify ownership → 
  Batch delete: scan doc + all userProjects with matching scanId

Delete Project → DELETE /api/project/{id} → verify ownership → delete project doc
```

## Firestore Collections

| Collection | Document ID | Key Fields |
|------------|-------------|------------|
| `users` | `uid` | `username`, `email`, `points`, `createdAt` |
| `scans` | auto | `userId`, `imageUrl`, `detectedObject`, `materialType`, `conditionAssessment`, `confidenceScore`, `suggestions[]`, `createdAt` |
| `userProjects` | auto | `userId`, `scanId`, `suggestionId`, `status` (saved/in_progress/completed), `startedAt`, `completedAt`, `pointsAwarded` |

## Setup

### Prerequisites
- Node.js 20+
- Firebase project (Auth, Firestore, Storage enabled)
- NVIDIA NIM API key (for vision models)

### Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required variables:
```env
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server-only)
FIREBASE_PROJECT_ID=...
FIREBASE_ADMIN_SERVICE_ACCOUNT=./service-account.json  # local path

# AI Vision
NVIDIA_NIM_API_KEY=...
```

### Service Account (Local Development)
1. Firebase Console → Project Settings → Service Accounts → Generate new private key
2. Save as `service-account.json` in project root (gitignored)
3. Set `FIREBASE_ADMIN_SERVICE_ACCOUNT=./service-account.json` in `.env`

### Install & Run
```bash
npm install
npm run dev
```
Opens at `http://localhost:3000`

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables in Vercel Project Settings → Environment Variables
   - For `FIREBASE_ADMIN_SERVICE_ACCOUNT`: paste entire JSON as value
4. Deploy

## Project Structure

```
app/
├── api/
│   ├── scan/route.ts           # POST: analyze image, create scan + projects
│   ├── award-points/route.ts   # POST: award 50 pts on project completion
│   ├── scan/[id]/route.ts      # DELETE: cascade delete scan + projects
│   ├── project/[id]/route.ts   # DELETE: delete single project
│   └── leaderboard/route.ts    # GET: top 50 users by points
├── auth/page.tsx               # Sign in / Sign up
├── dashboard/
│   ├── page.tsx                # Main dashboard (scans, projects, stats)
│   ├── scan/page.tsx           # Camera/upload scan page
│   ├── project/[id]/page.tsx   # Project detail (checklist, status)
│   ├── leaderboard/page.tsx    # Leaderboard (top 50)
│   └── account/page.tsx        # Username/email settings
└── layout.tsx                  # Root layout

lib/
├── firebase.ts                 # Client SDK init
└── firebase-admin.ts           # Admin SDK init (service account)

components/ui/                  # Reusable UI primitives (Button, Card, Input, Badge)
```

## Points System

| Action | Points |
|--------|--------|
| Create new scan | 25 |
| Complete a project (per suggestion) | 50 |

Points stored in `users/{uid}.points`, updated atomically via transactions.

## Security

- All API routes verify Firebase ID token (Authorization: Bearer <token>)
- Server-side ownership checks before any write/delete
- Firestore rules should restrict client reads/writes to owned documents
- Service account key never committed (gitignored)

## License

MIT