# Transcriptor Frontend - Next.js 14

## Architecture

Next.js 14 with App Router:

```
frontend/
├── src/
│   ├── app/                  # App Router pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing/Upload page
│   │   ├── jobs/
│   │   │   ├── page.tsx      # Job list
│   │   │   └── [id]/
│   │   │       └── page.tsx  # Job detail + results
│   │   └── globals.css
│   ├── components/           # React components
│   │   ├── upload/
│   │   │   ├── dropzone.tsx          # Drag-and-drop upload
│   │   │   ├── file-list.tsx         # Selected files list
│   │   │   └── upload-progress.tsx   # Upload + processing progress
│   │   ├── results/
│   │   │   ├── transcription-view.tsx # Spanish text display
│   │   │   ├── translation-view.tsx   # English text display
│   │   │   ├── side-by-side.tsx       # Parallel view (ES | EN)
│   │   │   └── export-buttons.tsx     # Download TXT/DOCX/SRT
│   │   ├── jobs/
│   │   │   ├── job-card.tsx          # Job summary card
│   │   │   └── job-status.tsx        # Status badge
│   │   └── ui/                       # Shared UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── progress.tsx
│   │       └── toast.tsx
│   └── lib/                  # Utilities
│       ├── api.ts            # API client (fetch wrapper)
│       ├── types.ts          # TypeScript types
│       └── utils.ts          # Helpers
├── package.json
└── Dockerfile
```

## Key Patterns

### Server Components by Default
Use Server Components unless interactivity is required.

### Client Components
Add `'use client'` only for:
- File upload (drag-and-drop, file input)
- Progress bars (real-time updates)
- Toast notifications
- Interactive buttons

### API Client
```typescript
// lib/api.ts - typed fetch wrapper
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function uploadAudio(file: File): Promise<Job> { ... }
export async function getJob(id: string): Promise<Job> { ... }
export async function getJobs(): Promise<Job[]> { ... }
export async function downloadExport(jobId: string, format: ExportFormat): Promise<Blob> { ... }
```

### File Upload UX
1. Drag-and-drop zone with format validation
2. File list with size display
3. Upload progress bar
4. Processing status (queued → transcribing → translating → done)
5. Results display with export options

## Commands

```bash
npm run dev          # Dev server (port 3000)
npm test             # Jest tests
npm run build        # Production build
npm run lint         # ESLint
npx playwright test  # E2E tests
```

## Rules

1. **Server Components** by default
2. **Client Components** only when needed (interactivity)
3. **Tailwind CSS** for all styling
4. **Accessible**: WCAG 2.1 AA compliant
5. **Responsive**: Mobile-first design
6. **Error states**: Always show meaningful errors
7. **Loading states**: Show progress for all async operations
