# Mobile Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt TaskCard, InputBar, and SearchBar for comfortable mobile usage while keeping the desktop experience unchanged.

**Architecture:** Mobile-first responsive Tailwind classes. Safe-area handled via CSS custom property (`--safe-bottom`) + `viewport-fit=cover`. No new components or state changes — purely visual/layout adjustments.

**Tech Stack:** React, Tailwind CSS 3, Vite

**Testing:** No test framework configured. All verification is visual — run `npm run dev` and check at mobile (<640px) and desktop (>=640px) viewports.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `index.html` | Modify (line 5) | Add `viewport-fit=cover` to meta viewport |
| `src/index.css` | Modify (line 11) | Add `--safe-bottom` CSS custom property |
| `src/components/TaskCard.tsx` | Modify (lines 95, 97) | Mobile vertical layout |
| `src/components/InputBar.tsx` | Modify (line 488) | Safe-area bottom positioning |
| `src/components/SearchBar.tsx` | Modify (line 12) | Responsive filter dropdown width |

---

### Task 1: TaskCard Mobile Vertical Layout

**Files:**
- Modify: `src/components/TaskCard.tsx` (lines 95, 97)

This is the highest-impact change. On mobile, cards currently show a cramped horizontal layout (160px image + squeezed text). After this task, mobile cards show the image full-width on top with text below, while desktop stays unchanged.

- [ ] **Step 1: Change the outer flex container to responsive layout**

In `src/components/TaskCard.tsx`, **line 95**, replace:

```tsx
      <div className="flex h-40">
```

with:

```tsx
      <div className="flex flex-col sm:flex-row sm:h-40">
```

- [ ] **Step 2: Change the image container to full-width on mobile**

In `src/components/TaskCard.tsx`, **line 97**, replace:

```tsx
        <div className="w-40 min-w-[10rem] h-full bg-gray-100 dark:bg-black/20 relative flex items-center justify-center overflow-hidden flex-shrink-0">
```

with:

```tsx
        <div className="w-full h-48 sm:w-40 sm:min-w-[10rem] sm:h-full bg-gray-100 dark:bg-black/20 relative flex items-center justify-center overflow-hidden sm:flex-shrink-0">
```

What changed and why:
- `w-full h-48` — on mobile, image spans full card width at 192px height (up from 160px, giving more image prominence)
- `sm:w-40 sm:min-w-[10rem] sm:h-full` — desktop unchanged (160x160 image area)
- `sm:flex-shrink-0` — only prevent shrinking in horizontal (desktop) layout

- [ ] **Step 3: Start dev server and verify**

Run: `npm run dev`

Check at **mobile viewport** (<640px, use browser DevTools device emulation):
- Task cards show image on top (full width, 192px tall), info text below
- Running spinner, error icon, and empty-state icon still centered correctly
- Image overlays (ratio badge, size badge, duration timer, multi-image count) still visible
- Prompt text, param tags, action buttons render below the image

Check at **desktop viewport** (>=640px):
- Layout unchanged — horizontal cards with image on left, text on right

- [ ] **Step 4: Commit**

```bash
git add src/components/TaskCard.tsx
git commit -m "feat: TaskCard mobile vertical layout"
```

---

### Task 2: Safe-Area Foundation

**Files:**
- Modify: `index.html` (line 5)
- Modify: `src/index.css` (after line 10)

`index.html` already has `apple-mobile-web-app-capable` and `black-translucent` status bar style, which means this app is expected to run as a PWA on iOS. Safe-area support is essential for notched phones and home indicator bars.

- [ ] **Step 1: Add viewport-fit=cover to meta viewport tag**

In `index.html`, **line 5**, replace:

```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

with:

```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Without `viewport-fit=cover`, `env(safe-area-inset-*)` always returns 0.

- [ ] **Step 2: Add safe-area CSS custom property**

In `src/index.css`, **inside the existing `:root` block** (line 8–11), add `--safe-bottom` as a new property. The full `:root` block becomes:

```css
:root {
  --font-ui-sans: 'HarmonyOS Sans SC', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-mono: 'Maple Mono', 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

On non-notched devices and desktop browsers, `env(safe-area-inset-bottom, 0px)` resolves to `0px`, so this has zero visual effect outside of notched phones.

- [ ] **Step 3: Verify**

Run: `npm run dev`

Open browser DevTools → Elements → `<html>` → Computed Styles. Search for `--safe-bottom`. It should be `0px` on desktop (expected — no safe area).

- [ ] **Step 4: Commit**

```bash
git add index.html src/index.css
git commit -m "feat: safe-area CSS foundation"
```

---

### Task 3: InputBar Safe-Area Bottom Positioning

**Files:**
- Modify: `src/components/InputBar.tsx` (line 488)

The InputBar floats at the bottom of the screen. On iPhones with a home indicator, it sits right on top of the indicator bar. This task pushes it up by the safe-area inset amount.

- [ ] **Step 1: Replace bottom positioning with safe-area-aware values**

In `src/components/InputBar.tsx`, **line 488**, replace:

```tsx
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-3 sm:px-4 transition-all duration-300">
```

with:

```tsx
      <div className="fixed bottom-[calc(1rem+var(--safe-bottom))] sm:bottom-[calc(1.5rem+var(--safe-bottom))] left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-3 sm:px-4 transition-all duration-300">
```

What changed:
- `bottom-4` (1rem) → `bottom-[calc(1rem+var(--safe-bottom))]` — on desktop `var(--safe-bottom)` is 0px, so same as before. On notched phones, adds the safe-area offset.
- `sm:bottom-6` (1.5rem) → `sm:bottom-[calc(1.5rem+var(--safe-bottom))]` — same logic for desktop breakpoint.

- [ ] **Step 2: Verify**

Run: `npm run dev`

Check at **desktop viewport**: InputBar bottom position visually unchanged (var is 0px).

Check at **mobile viewport**: InputBar bottom position unchanged on non-notched devices. If testing on a physical iPhone, confirm InputBar sits above the home indicator.

- [ ] **Step 3: Commit**

```bash
git add src/components/InputBar.tsx
git commit -m "feat: InputBar safe-area bottom positioning"
```

---

### Task 4: SearchBar Responsive Filter Width

**Files:**
- Modify: `src/components/SearchBar.tsx` (line 12)

The status filter dropdown is fixed at `w-32` (128px) on all screen sizes. On a 375px-wide phone, this leaves only ~220px for the search input after gaps. Reducing it to `w-28` (112px) on mobile gives the search input 16 more pixels.

- [ ] **Step 1: Make filter dropdown width responsive**

In `src/components/SearchBar.tsx`, **line 12**, replace:

```tsx
      <div className="relative w-32 flex-shrink-0 z-20">
```

with:

```tsx
      <div className="relative w-28 sm:w-32 flex-shrink-0 z-20">
```

`w-28` (112px) is enough for the longest option label "全部状态" (~56px text + 32px padding + 24px dropdown arrow buffer).

- [ ] **Step 2: Verify**

Run: `npm run dev`

Check at **mobile viewport** (<640px): filter dropdown shows "全部状态" without text truncation. Search input is wider than before.

Check at **desktop viewport** (>=640px): unchanged (128px width).

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchBar.tsx
git commit -m "feat: SearchBar responsive filter width on mobile"
```

---

## Self-Review

**Spec coverage:**
- TaskCard mobile vertical layout → Task 1 ✓
- Safe-area handling (viewport + CSS) → Task 2 ✓
- InputBar safe-area positioning → Task 3 ✓
- SearchBar responsive width → Task 4 ✓

**Placeholder scan:** No TBDs, TODOs, or vague instructions. Every step has exact code changes with before/after.

**Type consistency:** No types or function signatures changed. All changes are Tailwind CSS class strings.
