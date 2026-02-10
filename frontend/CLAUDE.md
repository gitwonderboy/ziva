# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Production build
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

Package manager: **npm**

## Architecture

React 19 SPA built with Vite (SWC plugin for Fast Refresh), Tailwind CSS v4, and React Router v7.

### App Flow

**Auth → Onboarding → Dashboard**

1. `AuthScreen` — email/password login (mock auth, stores user as `sync_inbox_user` in localStorage)
2. `OnboardingScreen` — Microsoft Outlook OAuth via AWS Lambda redirect; Gmail is placeholder only
3. `AuthSuccess` — OAuth callback handler, sets `onboarding_done` in localStorage, auto-redirects to dashboard
4. `DashboardScreen` — main app with tabs (Overview, Documents, Approved, Flagged, Settings), KPI cards, document table, and detail drawer

Route guards in `App.jsx` (`AppContent` component) use localStorage flags (`sync_inbox_user`, `onboarding_done`) with `<Navigate>` redirects.

### Data Layer

- **React Query** (`@tanstack/react-query`) for server state — cache key pattern: `['dashboardStats', userEmail]`
- **API service** in `src/services/api.js` — calls AWS Lambda endpoints in `af-south-1`
  - `GET /partner/stats?email=` — dashboard data (documents, stats, monthly breakdowns)
  - `GET /admin/scan?email=` — trigger inbox sync
  - `GET /login/microsoft?email=` — OAuth redirect
  - POST -
    `https://a4sklso1b4.execute-api.af-south-1.amazonaws.com/prod/property`
    - Add data to database
  - GET -
    `https://a4sklso1b4.execute-api.af-south-1.amazonaws.com/prod/properties/search`
    - Pull data from database
- API responses are transformed in `fetchDashboardData()` into normalized document objects and chart data

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin. Key design tokens:
- Dark panels: `slate-900/800/700`
- Primary accent: `indigo-600`
- Status: `emerald` (success), `amber` (warning), `red` (critical)
- Large rounded corners (`rounded-xl` to `rounded-[2.5rem]`)

### Component Patterns

- Helper components (`DetailBox`, `SidebarButton`, `KPICard`, `StatusBadge`, `TabButton`) are defined inline within parent component files, not as separate modules
- Icons from `lucide-react`
- Charts from `recharts`
- Celebration effects via `canvas-confetti`

## ESLint Config

Flat config in `eslint.config.js`. `no-unused-vars` is set to error but ignores uppercase-starting variables (React components). React Hooks and React Refresh plugins are active.

## Notable Gaps

- No test framework configured (no Vitest/Jest)
- No error boundaries
- No Prettier/formatter config
- Auth is mock (accepts any email)
