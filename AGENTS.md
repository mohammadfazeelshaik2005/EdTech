# Permanent Visual Design System Rule for PathSync AI

> **CRITICAL DIRECTIVE:**
> This repository contains the permanent visual design system for the **PathSync AI** application.
> Every future page, component, feature, or layout built for PathSync AI MUST adhere to this design system.
> Do NOT redesign the visual language independently for individual pages.

---

## 1. Design System Assets Location
- **Design System Spec:** `design/DESIGN_SYSTEM.md`
- **Design Reference Screenshot:** `design/reference/pathsync-design-reference.png`
- **Centralized Design Tokens (JSON):** `design/tokens.json`
- **CSS Design Tokens:** `css/tokens.css`
- **Baseline CSS Reset:** `css/reset.css`
- **Component Styles:** `css/components.css`
- **Component Behaviors:** `js/components.js`
- **Interactive Component Browser & Landing Page Showcase:** `index.html`

---

## 2. Core Aesthetic & Brand Guidelines
- **Primary Brand Color:** Deep teal/emerald (`--color-brand-primary`: `#0A6C58`, hover: `#085444`, dark: `#06392F`).
- **Text Hierarchy:** Dark navy/charcoal (`--color-text-primary`: `#0F172A`) for bold headings; muted slate (`--color-text-secondary`: `#475569`) for body text.
- **Backgrounds:** Pure white (`#FFFFFF`) canvas and very light neutral (`--color-bg-alternate`: `#F8FAFC`) for alternating sections.
- **Accents:** Soft green/mint (`--color-brand-primary-subtle`: `#EBF7F3`, `--color-accent-mint`: `#10B981`).
- **Typography:** Standardize on `Inter` with modern line heights and snug tracking on headings.
- **UI Architecture:** Rounded cards (`16px-20px`), subtle borders (`#E2E8F0`), soft layered shadows, pill badges (`9999px`), premium rounded buttons, and generous whitespace.

---

## 3. Reusable Components to ALWAYS Use
When building new pages or features, always reuse the canonical component classes from `css/components.css`:
1. `Button` (`.ps-btn`, `.ps-btn--primary`, `.ps-btn--secondary`, `.ps-btn--outline`, `.ps-btn--pill`)
2. `Input` (`.ps-input`, `.ps-input-group`, `.ps-select`, `.ps-textarea`)
3. `Card` (`.ps-card`, `.ps-card--interactive`, `.ps-card--forest`)
4. `Badge` (`.ps-badge`, `.ps-badge--pill`, `.ps-badge--brand`, `.ps-badge--mint`)
5. `Modal` (`dialog.ps-modal-dialog`, `.ps-modal-container`, `closedby="any"`)
6. `Avatar` (`.ps-avatar`, `.ps-avatar-group`)
7. `Dropdown` (`.ps-dropdown`, `.ps-dropdown-menu`)
8. `Navbar` (`.ps-navbar`, `.ps-navbar-container`, `.ps-navbar-brand`)
9. `Sidebar` (`.ps-sidebar`, `.ps-sidebar-nav-item`)
10. `PageHeader` (`.ps-page-header`, `.ps-breadcrumbs`)
11. `SectionHeader` (`.ps-section-header`, `.ps-section-eyebrow`, `.ps-section-title`)
12. `StatCard` (`.ps-stat-card`, `.ps-stat-card--dark`)
13. `LoadingState` (`.ps-skeleton`, `.ps-spinner`)
14. `EmptyState` (`.ps-empty-state`)
15. `ErrorState` (`.ps-error-state`)
16. `OpportunityCard` (`.ps-opportunity-card`)

---

## 4. Absolute Prohibitions
- NEVER introduce random or uncoordinated ad-hoc colors (e.g. raw bright blue, generic purple, unstyled red).
- NEVER alter component border radii or font families on individual sub-pages.
- NEVER write styles without utilizing the centralized CSS tokens (`tokens.css`).
