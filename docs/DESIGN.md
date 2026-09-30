# 🎨 Design System

# **ECOFlow — Dark. Modern. Engineering-grade.**

This document defines the visual design system, UI components, and user experience rules for the ECOFlow application. The goal is a modern, dark, glassmorphic interface with a consistent, engineering-focused feel.

---

## 1. Design Principles

| | | |
|:---:|:---:|:---:|
| 👥 **User-Centered** | 🪶 **Minimal & Clean** | 🧩 **Consistent** |
| Simple and intuitive for engineering & operations teams. | Reduce clutter and focus on data density. | Follow a unified component and token system. |

---

## 2. Color Palette

Primary colors used across the application (defined in `client/tailwind.config.js`):

| Swatch | Name | Hex | Usage |
|:---:|---|---|---|
| 🟪 | **Primary** | `#6366f1` (Indigo 500) | Main brand color: buttons, links, active states, focus rings |
| 🟪 | **Primary Hover** | `#4f46e5` (Indigo 600) | Button hover / pressed states |
| 🟪 | **Secondary** | `#a855f7` (Purple 500) | Secondary actions, badges, highlights |
| 🟦 | **Accent** | `#06b6d4` (Cyan 500) | Charts, info accents, gradients |
| ⬛ | **Background** | `#09090b` (Zinc 950) | App background |
| ⬛ | **Surface** | `#18181b` (Zinc 900) | Cards, modals, navbars |
| ⬛ | **Surface Highlight** | `#27272a` (Zinc 800) | Hover surfaces, inputs |
| ⬜ | **Text Main** | `#f4f4f5` (Zinc 100) | Headings and body text |
| ⬜ | **Text Muted** | `#a1a1aa` (Zinc 400) | Captions, placeholders, secondary text |

**Semantic colors** (Tailwind palette): 🟢 success `emerald-500` · 🟡 warning `amber-500` · 🔴 error `rose-500` · 🔵 info `blue-500`

**Brand gradient** (logo & hero text): `from-primary via-secondary to-accent` — applied via the `.text-gradient` utility.

---

## 3. Typography

We use **Inter** as the primary font for a clean, readable, engineering-grade look.

| Element | Class / Size |
|---|---|
| Font family | `font-sans` → Inter, sans-serif |
| Page title (h1) | `text-3xl font-bold tracking-tight` |
| Section title (h2) | `text-xl font-semibold` |
| Body | `text-sm` (14px) |
| Muted caption | `text-sm text-text-muted` |
| Numeric/data tables | `font-medium tabular-nums` |

---

## 4. UI Components

Standard components to be used throughout the app (`.glass` / `.glass-card` utilities from `client/src/index.css`):

### Buttons
`Primary` (indigo, solid) · `Secondary` (surface + border) · `Destructive` (rose, solid) — rounded-lg, `focus-visible:ring-2 ring-primary/50`.

### Cards
Use `.glass-card`: translucent surface (`bg-surface/40`), `backdrop-blur-md`, hairline border (`border-white/5`), hover brightens border. Modals and sidebars use the stronger `.glass` (60% opacity, `blur-xl`).

### Inputs
Dark fill `bg-surfaceHighlight`, border `border-border (#3f3f46)`, `rounded-lg`, indigo focus ring, placeholder `text-text-muted`.

### Badges / Status
| Status | Color |
|---|---|
| DRAFT | `zinc` |
| IN_REVIEW | `amber` |
| APPROVED | `emerald` |
| APPLIED | `cyan` |
| SUSPENDED / Error | `rose` |

### Toasts & Notifications
Top-right fixed stack (`fixed top-4 right-4`), glass cards with colored left icon (✅ emerald, ❌ rose, ⚠️ amber, ℹ️ blue), slide-in `framer-motion` animation, auto-dismiss 5s.

### Data Tables
Row hover `bg-surfaceHighlight/50`, sticky header on scroll, `tabular-nums` for quantities/prices, action icons right-aligned.

---

## 5. Motion & Feedback

| Animation | Usage | Timing |
|---|---|---|
| `fade-in` | Page/section entry | 0.5s ease-out |
| `slide-up` | Cards, modals | 0.5s ease-out |
| `.animate-enter` | List items | 0.6s cubic-bezier(0.16, 1, 0.3, 1) |
| `pulse-slow` | Live SSE indicator | 3s infinite |

---

## 6. Layout & Responsiveness

- **App shell:** fixed sidebar (desktop) / drawer (mobile) + top navbar + scrollable content area.
- **Breakpoints:** mobile-first; tables collapse to stacked cards below `md`.
- **Density:** engineering users prefer density — padding `p-4`, table cells `py-2 px-3`.
- **Dark only:** `color-scheme: dark` is set globally (`client/src/index.css`); do not add light-theme branches.

---

## 7. Do / Don't

- ✅ Reuse `.glass-card`, badges and button variants — don't invent new styles per page.
- ✅ Keep text on `text-main`; use `text-muted` only for secondary info.
- ❌ Don't use pure black `#000` or pure white `#fff` backgrounds.
- ❌ Don't add colored shadows/glows outside `primary-glow` for focus states.
