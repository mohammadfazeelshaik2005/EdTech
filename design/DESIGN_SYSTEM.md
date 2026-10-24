# PathSync AI — Permanent Visual Design System Specification
**Version:** 1.0.0 (Established October 2026)  
**Status:** Permanent Brand Standard  
**Primary Visual Inspiration:** `/design/reference/pathsync-design-reference.png`

---

## 1. Executive Summary & Design Philosophy

PathSync AI is an intelligent, high-impact academic and career pathway platform designed for modern learners, universities, and industry partners. 

The visual design system is strictly codified from the verified visual language of our reference standard. It combines:
- **Trust & Academic Rigor:** Deep forest teal, structured card containers, generous whitespace, and crisp typography.
- **Modern SaaS Polish:** Layered soft shadows, pill badges, micro-animations, glassmorphism sticky navigation, and tactile button states.
- **Clarity & Student Focus:** High-contrast text hierarchy, clear metric cards, and intuitive pathway opportunity cards.

> **MANDATORY POLICY:**  
> This visual design system is **permanent**. Every future page, dashboard, modal, and feature in the PathSync AI platform must strictly adhere to these tokens, component classes, and layout rules. No ad-hoc or disjointed styling should be introduced.

---

## 2. Color Architecture

The PathSync AI color palette balances deep botanical teals with crisp neutrals and vibrant feedback accents.

| Token Name | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `--color-brand-primary` | `#0A6C58` | Primary brand color. Primary buttons, active tabs, main links, key focus rings. |
| `--color-brand-primary-hover` | `#085444` | Darker teal for button hover and interactive states. |
| `--color-brand-primary-active` | `#064034` | Pressed button state and high-emphasis interaction. |
| `--color-brand-primary-subtle` | `#EBF7F3` | Very soft green tint for icon boxes, pill badges, and active menu backgrounds. |
| `--color-brand-primary-muted` | `#C2EADB` | Border accent for subtle badges and active card borders. |
| `--color-brand-primary-dark` | `#06392F` | Signature deep forest teal for featured cards, hero spotlight banners, and dark CTA sections. |
| `--color-brand-primary-darker` | `#04261F` | Deep forest dark navy for footers and high-contrast dark backdrops. |
| `--color-accent-mint` | `#10B981` | High-energy emerald mint for match scores, active status dots, and success pills. |
| `--color-accent-lime` | `#84CC16` | Accent lime for highlights and promotional tags. |
| `--color-text-primary` | `#0F172A` | Slate 900. Charcoal navy for hero headlines, section titles, and high-contrast text. |
| `--color-text-secondary` | `#475569` | Slate 600. Clean, readable body paragraphs and descriptions. |
| `--color-text-tertiary` | `#64748B` | Slate 500. Metadata labels, dates, subtitle text, and input placeholders. |
| `--color-text-quaternary` | `#94A3B8` | Slate 400. Disabled states and subtle decorative icons. |
| `--color-text-inverse` | `#FFFFFF` | Pure white text on deep forest teal and dark backgrounds. |
| `--color-text-inverse-muted` | `#CBD5E1` | Slate 300. Secondary text on deep forest teal containers. |
| `--color-bg-canvas` | `#FFFFFF` | Default pure white page background. |
| `--color-bg-surface` | `#FFFFFF` | Primary white card surface. |
| `--color-bg-alternate` | `#F8FAFC` | Very light neutral background for alternating sections to create subtle depth. |
| `--color-bg-subtle` | `#F1F5F9` | Slate 100 for chips, search bar backgrounds, and subtle dividers. |
| `--color-border-default` | `#E2E8F0` | Default card borders, input borders, and navbar borders. |
| `--color-border-brand` | `#A7DBC8` | Brand-tinted border for active cards and hover states. |

---

## 3. Typography Hierarchy

PathSync AI standardizes on **Inter** (with fallback to system sans-serif fonts). All headings feature tightened letter-spacing (`-0.015em` to `-0.03em`) for a premium editorial and technological look.

| Style / Level | Font Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display (H1)** | `clamp(2.5rem, 5vw, 3.75rem)` | 800 (Extrabold) | 1.15 | `-0.03em` | Primary hero banner title |
| **Section Title (H2)** | `clamp(1.75rem, 3.5vw, 2.25rem)` | 700 (Bold) | 1.25 | `-0.02em` | Section headers across all pages |
| **Card / Subsection (H3)** | `1.5rem` (24px) | 600 (Semibold) | 1.3 | `-0.015em` | Prominent card headings, modal titles |
| **Feature Title (H4)** | `1.25rem` (20px) | 600 (Semibold) | 1.35 | `-0.01em` | Stat values, opportunity card titles |
| **Component Title (H5)** | `1.125rem` (18px) | 600 (Semibold) | 1.4 | `0em` | List item titles, small card headers |
| **Body Large** | `1.125rem` (18px) | 400 / 500 | 1.6 | `0em` | Hero lead paragraph |
| **Body Regular** | `1.0rem` (16px) | 400 (Regular) | 1.6 | `0em` | Standard text content, articles, cards |
| **Body Small** | `0.875rem` (14px) | 500 (Medium) | 1.5 | `0em` | Buttons, navigation links, input fields |
| **Caption / Badge** | `0.75rem` (12px) | 600 (Semibold) | 1.3 | `+0.05em` | Eyebrow badges, metadata pills, timestamps |

---

## 4. Spacing, Radii & Shadow Elevation

### Spacing Scale (4px / 8px Base Rhythm)
- `var(--space-1)`: `4px`
- `var(--space-2)`: `8px`
- `var(--space-3)`: `12px`
- `var(--space-4)`: `16px`
- `var(--space-5)`: `20px`
- `var(--space-6)`: `24px`
- `var(--space-8)`: `32px`
- `var(--space-10)`: `40px`
- `var(--space-12)`: `48px`
- `var(--space-16)`: `64px`
- `var(--space-20)`: `80px`

### Border Radii System
- **Pills / Badges / Round Buttons:** `var(--radius-full)` (`9999px`)
- **Spotlight Banners:** `var(--radius-3xl)` (`32px`)
- **Hero Visual Cards:** `var(--radius-2xl)` (`24px`)
- **Modals & Elevated Large Cards:** `var(--radius-xl)` (`20px`)
- **Standard Cards & Stat Cards:** `var(--radius-lg)` (`16px`)
- **Inputs & Standard Buttons:** `var(--radius-md)` (`10px`)
- **Small Badges & Tooltips:** `var(--radius-sm)` (`6px`)

### Layered Elevation Shadows
- **Base Surface (`--shadow-sm`):** `0 2px 4px 0 rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.02)`
- **Standard Card (`--shadow-md`):** `0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`
- **Hover & Floating (`--shadow-lg`):** `0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04)`
- **Modal Dialog (`--shadow-2xl`):** `0 25px 50px -12px rgba(15, 23, 42, 0.18)`
- **Brand Glow (`--shadow-brand`):** `0 8px 20px -4px rgba(10, 108, 88, 0.28)`

---

## 5. Specification of Core Reusable Components

### 1. Button (`.ps-btn`)
- **Variants:** Primary (`.ps-btn--primary`), Secondary Soft Mint (`.ps-btn--secondary`), Outline (`.ps-btn--outline`), Ghost (`.ps-btn--ghost`), Dark Navy (`.ps-btn--dark`), Light on Dark (`.ps-btn--light`).
- **Modifiers:** Pill (`.ps-btn--pill`), Sizes (`--sm`, `--md`, `--lg`), Icon-only (`--icon-only`).
- **Interactive State:** `transform: translateY(-1px)` on hover with smooth `200ms` transition.

### 2. Input (`.ps-input`, `.ps-input-group`)
- **Variants:** Standard text input, Search input with left icon (`.ps-input-wrapper--has-left-icon`), Dropdown Select (`.ps-select`), Multiline Textarea (`.ps-textarea`).
- **States:** Default, Hover, Focus (with brand teal glow ring `0 0 0 3px rgba(10, 108, 88, 0.15)`), Error (`.ps-input-group--error`), Disabled.

### 3. Card (`.ps-card`)
- **Standard Card:** Clean white, `16px` border radius, subtle `#E2E8F0` border, soft shadow.
- **Interactive Card (`.ps-card--interactive`):** Smooth lift `translateY(-3px)`, elevated shadow, and teal border highlight on hover.
- **Featured Forest Card (`.ps-card--forest`):** Signature deep forest teal gradient with white typography and translucent pill accents.
- **Alternate Card (`.ps-card--alternate`):** Crisp neutral backdrop for secondary hierarchy.

### 4. Badge (`.ps-badge`)
- **Variants:** Brand Teal (`.ps-badge--brand`), Mint Success (`.ps-badge--mint`), Neutral Slate (`.ps-badge--neutral`), Amber Warning (`.ps-badge--warning`), Danger Crimson (`.ps-badge--danger`), Info (`.ps-badge--info`).
- **Modifiers:** Pill shape (`.ps-badge--pill`), Status dot indicator (`.ps-badge-dot`).

### 5. Modal (`dialog.ps-modal-dialog`)
- Native HTML `<dialog closedby="any">` implementation with full backdrop blur (`backdrop-filter: blur(4px)`) and fallback light-dismiss click outside handler.
- Structured with `.ps-modal-header`, `.ps-modal-body`, and `.ps-modal-footer`.

### 6. Avatar (`.ps-avatar`, `.ps-avatar-group`)
- High-res photo avatar with initials fallback.
- Status dots for Online (mint green), Busy (red), Away (amber).
- Avatar stacking group (`.ps-avatar-group`) with overlapping negative margins and "+N" overflow chip.

### 7. Dropdown (`.ps-dropdown`)
- Clean floating popover with rounded corners, divider, icon support, and active selection state.
- Keyboard accessible and light-dismiss on document click.

### 8. Navbar (`.ps-navbar`)
- Sticky 72px glassmorphic navbar (`backdrop-filter: blur(10px)`).
- PathSync AI brand emblem, active link indicators with smooth underline bars, and responsive mobile toggle.

### 9. Sidebar (`.ps-sidebar`)
- Modern dashboard sidebar with grouped navigation items, active badge states, and bottom user profile card.

### 10. PageHeader (`.ps-page-header`)
- Hierarchical breadcrumbs trail, prominent H1 title, descriptive subtitle, and contextual action buttons.

### 11. SectionHeader (`.ps-section-header`)
- Distinctive eyebrow pill (e.g., `• OUR PROGRAMS`), bold H2 title with accented typography, descriptive subtitle, and optional right-aligned action link.

### 12. StatCard (`.ps-stat-card`)
- Large metric value (`28px` bold), label, descriptive subtext, soft teal icon box, and trend indicator badge (`+14% this month`).
- Supported in both Light mode and Forest Dark mode.

### 13. LoadingState (`.ps-skeleton`, `.ps-spinner`)
- Shimmer skeleton loaders for text, cards, and avatars to ensure seamless transitions.
- Dual-tone spinning ring indicator.

### 14. EmptyState (`.ps-empty-state`)
- Centered layout with circular icon container, friendly heading, explanatory copy, and clear call-to-action button.

### 15. ErrorState (`.ps-error-state`)
- Soft crimson surface with clear error description and action buttons for "Retry" and "Support".

### 16. OpportunityCard (`.ps-opportunity-card`)
- Inspired by the academic and career program cards in the reference design.
- Features: Category pill, Match percentage badge (e.g. `98% Match`), program title, institution/partner name, metadata pills (Location, Duration, Stipend), and dual action buttons.

---

## 6. Implementation Checklist & Developer Guidelines

1. **Include Core Files:** Every PathSync AI page must load:
   - `<link rel="stylesheet" href="/css/tokens.css">`
   - `<link rel="stylesheet" href="/css/reset.css">`
   - `<link rel="stylesheet" href="/css/components.css">`
   - `<script src="/js/components.js" defer></script>`
2. **Never Hardcode Hex Values:** Always reference CSS variables (`var(--color-brand-primary)`, `var(--space-4)`, etc.).
3. **Respect Hierarchy:** Never place low-contrast text on light backgrounds. Ensure WCAG AAA contrast for body copy.
4. **Permanent Standard:** Any additions must extend this system without breaking established tokens.
