# PathSync AI — Permanent Visual Design System

Welcome to the **PathSync AI** project.

This repository establishes the **permanent visual design system** for the entire PathSync AI platform, codified directly from the reference standard in [`/design/reference/pathsync-design-reference.png`](design/reference/pathsync-design-reference.png).

---

## 🎨 Visual Identity & Design Language

- **Primary Brand Color:** Deep Teal / Emerald (`#0A6C58`, hover `#085444`, dark `#06392F`)
- **Text Palette:** Dark navy/charcoal (`#0F172A`) for bold headings; muted slate (`#475569`) for high-readability body copy.
- **Backgrounds:** Pure white (`#FFFFFF`) canvas, alternating with crisp light neutral (`#F8FAFC`) to create natural visual rhythm.
- **Accents:** Soft green/mint (`#EBF7F3`, `#10B981`) for pill badges, metric highlights, and verification states.
- **Typography:** Modern `Inter` sans-serif hierarchy with tight letter tracking on headings.
- **UI Treatment:** Generous whitespace, 16px-24px rounded card surfaces, subtle borders (`#E2E8F0`), soft layered shadows, and tactile pill buttons.

---

## 📁 Repository Structure

```
PathSync/
├── client/                               # Frontend Application (React 19 + Vite + Tailwind CSS)
│   ├── index.html                        # Application HTML entry point
│   ├── package.json                      # Frontend dependencies & scripts
│   ├── vite.config.ts                    # Vite config with /api proxy to http://localhost:5000
│   ├── tsconfig.json                     # Client TypeScript configuration
│   └── src/
│       ├── components/                   # UI & feature components (Assessment, Chatbot, etc.)
│       ├── context/                      # AuthContext and state providers
│       ├── data/                         # Mock dataset fallbacks
│       ├── layouts/                      # Public, Auth, and Dashboard layouts
│       ├── pages/                        # 16 full product pages
│       ├── services/                     # Frontend API clients (Supabase, Gemini, etc.)
│       ├── styles/                       # Design tokens and styling
│       ├── App.tsx                       # React Router and main routes
│       └── main.tsx                      # DOM root mount
│
├── server/                               # Backend Application (Node.js + Express + TypeScript)
│   ├── package.json                      # Backend dependencies (Express, @google/genai, pg, etc.)
│   ├── tsconfig.json                     # Server TypeScript configuration
│   ├── src/
│   │   ├── index.ts                      # Express API server entry point (Port 5000)
│   │   ├── routes/                       # Express route modules (/api/gemini, /api/pipeline, /api/opportunities)
│   │   ├── services/                     # Gemini SDK client, scraping pipeline, verification
│   │   ├── lib/                          # Asia/Kolkata deadline and audit utilities
│   │   └── types/                        # Backend data collection & ingestion types
│   └── scripts/                          # Autonomous server tasks (seed-supabase.ts, scheduled refresh)
│
├── database/                             # Standalone PostgreSQL Docker & SQL schemas
├── supabase/                             # Production Supabase schemas, migrations & functions
├── design/                               # Design system spec, tokens.json, reference image
├── css/                                  # Canonical design system stylesheets (tokens, components)
├── js/                                   # Component interactive behaviors
├── AGENTS.md                             # Permanent Design System Guidelines
├── package.json                          # Monorepo workspaces coordinator (runs client + server)
└── README.md                             # Project documentation
```

---

## 🧩 The 16 Canonical Reusable Components

Every future page of PathSync AI must reuse these components:

1. **Button** (`.ps-btn`): Primary, Secondary, Outline, Ghost, Dark, Light, Pill, Sizes (`sm`, `md`, `lg`), Loading state.
2. **Input** (`.ps-input`, `.ps-input-group`): Text, Search with icon, Select, Textarea, Error states, Focus rings.
3. **Card** (`.ps-card`): Standard, Interactive Hover (`.ps-card--interactive`), Deep Forest Spotlight (`.ps-card--forest`).
4. **Badge** (`.ps-badge`): Pill badges with variants (Brand, Mint, Neutral, Warning, Danger, Info) and dot indicators.
5. **Modal** (`dialog.ps-modal-dialog`): Modern HTML5 `<dialog closedby="any">` with backdrop blur and accessible dismissal.
6. **Avatar** (`.ps-avatar`, `.ps-avatar-group`): Sizes `xs`–`xl`, status indicators (online, busy, away), initials fallbacks, and learner stacks.
7. **Dropdown** (`.ps-dropdown`): Accessible dropdown menus with icons, dividers, and active selections.
8. **Navbar** (`.ps-navbar`): Sticky 72px glassmorphic navigation bar with brand icon, navigation links, and rounded CTA.
9. **Sidebar** (`.ps-sidebar`): Modern dashboard navigation with grouped items, icons, active pills, badges, and user profile chip.
10. **PageHeader** (`.ps-page-header`): Breadcrumbs trail, page title, subtitle, and action controls.
11. **SectionHeader** (`.ps-section-header`): Eyebrow tag (`• OUR PROGRAMS`), bold H2 title, subtitle, and right-aligned link.
12. **StatCard** (`.ps-stat-card`): Metric values, labels, trend badges (`+14%`), soft teal icon containers, in Light and Dark variants.
13. **LoadingState** (`.ps-skeleton`, `.ps-spinner`): Shimmer skeleton loaders for text, cards, avatars, and CSS ring spinners.
14. **EmptyState** (`.ps-empty-state`): Clean centered container with icon circle, friendly title, description, and primary CTA.
15. **ErrorState** (`.ps-error-state`): Non-disruptive soft crimson card with alert icon, error message, and Retry / Support buttons.
16. **OpportunityCard** (`.ps-opportunity-card`): Academic fellowship and internship cards with match score pills, metadata pills, and apply buttons.

---

## 🚀 How to Run & Preview

Run both the Client and Server concurrently from the root directory:

```bash
# Start both Backend (Port 5000) and Frontend (Port 3000) simultaneously:
npm run dev

# Or run individually:
npm run dev:client    # Vite frontend dev server (http://localhost:3000)
npm run dev:server    # Express backend API server (http://localhost:5000)
```

The frontend at `http://localhost:3000` automatically proxies all `/api/*` network requests to the backend server running at `http://localhost:5000`.

---

## 🗄️ PostgreSQL Database Setup

PathSync AI is engineered with a production PostgreSQL architecture. You have two options to run the database:

### Option A: Supabase Hosted PostgreSQL (Recommended)
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Run the schema: [`supabase/schema.sql`](supabase/schema.sql).
4. Run the seed data: [`supabase/seed.sql`](supabase/seed.sql).
5. Copy your **Project URL** and **anon public key** from *Project Settings > API* into `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Option B: Local Standalone PostgreSQL (Docker)
1. Start the containerized PostgreSQL 16 database and pgAdmin:
   ```powershell
   npm run db:up
   # or: docker compose up -d
   ```
2. The database initializes automatically with all tables and seeds from [`database/standalone-postgres.sql`](database/standalone-postgres.sql).
3. Access pgAdmin at `http://localhost:5050` (Login: `admin@pathsync.ai` / `admin`).

