# 🎨 RazorRecover UI Design System Specification

## 1. Overview & Brand Identity

RazorRecover's frontend design language is modeled after the **Razorpay Buildathon aesthetic**—combining clean, trustworthy fintech minimalism with modern developer-centric clarity.

---

## 2. Semantic Color Palette

| Token | Hex Value | Semantic Purpose |
| :--- | :--- | :--- |
| `--color-primary` / `brand-600` | `#0284C7` | Primary action buttons, active navigation states, brand accents |
| `brand-900` / `navy-900` | `#0C2D57` / `#0A1324` | Sidebar and header elevated surfaces |
| `navy-950` | `#060B16` | Main viewport canvas background |
| `surface-card` | `#0F172A` | Primary card background |
| `surface-border` | `#1E293B` | Subtle card, input, and table borders |
| `emerald-500` / `success` | `#10B981` | Recovered revenue, approved decisions, positive lift metrics |
| `amber-500` / `warning` | `#F59E0B` | Revenue at risk, pending operator approvals, medium risk level |
| `rose-500` / `danger` | `#EF4444` | Payment failures, high risk level, policy rejections |
| `indigo-500` / `purple` | `#6366F1` | AI advisory layer, machine learning models, simulation mode |

---

## 3. Typography & Numerical Scaling

* **Font Stack:** Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.
* **Monospace Stack:** JetBrains Mono, Fira Code, monospace (used for transaction IDs, trace IDs, currency paise, and timestamps).
* **Scale Hierarchy:**
  * **H1 / Metric Figures:** `text-3xl font-extrabold tracking-tight tabular-nums`
  * **H2 / Page Titles:** `text-2xl font-bold tracking-tight text-white`
  * **H3 / Section Headers:** `text-base font-semibold text-white tracking-tight`
  * **Body / Subtitles:** `text-xs text-slate-400 font-normal leading-relaxed`
  * **Eyebrow Tags:** `text-[10px] uppercase font-mono font-semibold tracking-wider`

---

## 4. Component Gallery

### 4.1 Cards (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`)
* **Styling:** `bg-surface-card/90 border border-surface-border rounded-xl shadow-card-subtle backdrop-blur-sm`
* **Hover:** `hover:border-slate-700/80 hover:shadow-glow-brand`

### 4.2 KPI Widgets (`StatCard`)
* Features icon badge, large tabular numbers, trend pill, and contextual subtitle.

### 4.3 Buttons (`Button`)
* **Variants:** `primary` (Razorpay Blue), `secondary` (Slate 800), `outline` (Transparent border), `success` (Emerald), `danger` (Rose), `ghost`.
* Built-in spinner loader state with active scale bounce.

### 4.4 Badges (`Badge`, `StatusBadge`, `RiskBadge`, `ExecutionModeBadge`)
* Small, rounded pills with optional pulsing status indicator dot.

### 4.5 Modals (`Modal`)
* Accessible dialog with backdrop blur, keyboard Escape listener, and smooth slide-up animation.

---

## 5. Responsiveness & Layout

* **Max Width Container:** `max-w-7xl mx-auto` with flexible padding (`p-4 md:p-6 lg:p-8`).
* **Mobile Breakpoint:** Collapsible slide-over drawer navigation on screens $< 768\text{px}$.
* **Tables:** Wrapped in `overflow-x-auto` to allow horizontal scrolling on mobile viewports.

---

## 6. Accessibility Checklist (WCAG AA)

- [x] High-contrast text colors on dark backgrounds (Slate 100/200 on Navy 950).
- [x] Clear focus rings (`focus:ring-2 focus:ring-brand-500/50`) on all interactive buttons and inputs.
- [x] Keyboard navigation supported on all routes, tables, and dialog modals.
- [x] Screen-reader friendly semantic tags (`header`, `nav`, `aside`, `main`, `table`, `thead`, `tbody`).
