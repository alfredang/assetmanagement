# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page marketing site for **Apex Asset Management** (a fictional asset-management firm). Pure static site — **no build step, no framework, no package manager**. Three flat files at the project root:

- `index.html` — semantic single-page structure
- `styles.css` — design tokens + components + responsive rules
- `script.js` — interactivity (IIFE, no modules)

The only runtime dependency is Google Fonts (Playfair Display + Inter) loaded via `<link>` in `index.html`.

## Running

```powershell
# From the project root:
python -m http.server 8000
# then open http://localhost:8000
```

File-protocol (`file:///…/index.html`) also works, but serving over HTTP is recommended because the contact form uses `fetch()` to POST to FormSubmit.

There are no tests, no linter, and no formatter configured.

## Architecture notes

### Design system lives in CSS custom properties
`:root` in `styles.css` defines the entire palette (navy / gold), typography stack, spacing scale, radii, and shadows. **Change tokens there, not in individual rules.** Component styles consume `var(--…)` throughout.

### Sections are anchor targets
Each `<section>` has an `id` matching a nav link (`#home`, `#why-us`, `#testimonials`, `#contact`). Smooth scrolling is done in CSS via `scroll-behavior: smooth` plus `scroll-padding-top: var(--nav-height)` to offset for the fixed navbar — JS does **not** intercept link clicks.

### Hero stat counters are data-driven
`.stat-value` elements in the hero declare their animation target via data attributes:
- `data-target` — final numeric value
- `data-prefix` / `data-suffix` — strings wrapped around the number (e.g. `$`, `B`, `+`)
- `data-decimals` — fractional digits to render

`script.js` reads these on the first IntersectionObserver hit and animates 0 → target with easeOutCubic. To add a new counter, add a `.stat-value` element with those attributes — no JS change needed.

### Fade-in is opt-in via class
Any element with the `.fade-in` class is observed by an IntersectionObserver and gets `.visible` added on first intersection. Add `.fade-in` to new sections you want to animate; remove it if you don't.

### Reduced-motion is respected globally
`prefers-reduced-motion: reduce` is honored in two places — the CSS media query disables transitions/animations and skips the fade-in offset, and `script.js` checks `matchMedia('(prefers-reduced-motion: reduce)').matches` to short-circuit the counter animation and disable carousel auto-rotation. Preserve both when adding new motion.

### Testimonial carousel: state in JS, transform in CSS
`#carouselTrack` is a flex row; `script.js` updates `transform: translateX(-N * 100%)` to advance slides. Auto-rotates every 5s, pauses on hover/focus-within. Slide markup lives in `index.html` — to add a slide, append an `<li class="slide">` and a matching `<button class="dot">` to the dots container.

### Contact form uses FormSubmit + async fetch
The form posts to `https://formsubmit.co/your-email@example.com` (placeholder — replace with a real address). Hidden inputs configure FormSubmit:
- `_subject` — email subject line
- `_captcha=false` — disables FormSubmit's captcha
- `_template=table` — clean tabular email format
- `_next` — redirect URL after native (no-JS) submission
- `_honey` — honeypot field, kept hidden

`script.js` intercepts submit, validates client-side, then `fetch()`-POSTs the FormData with `Accept: application/json` so the response is JSON (no page navigation). **First-time activation:** FormSubmit emails the configured address on the first submission with a confirmation link that must be clicked to activate the endpoint.

## Working in this codebase

- Prefer editing existing files; do not introduce build tooling, frameworks, or npm.
- When adding sections, follow the existing pattern: `<section id="…" class="section …">` → eyebrow + h2 inside `.section-head` → content inside `.container`.
- SVG icons are inlined (no icon font, no sprite). Match the existing 24×24 viewBox + `stroke-width="2"` style for new icons.
- Target: Lighthouse Performance ≥ 90 and Accessibility ≥ 90. Don't add heavy assets, blocking scripts, or images without explicit width/height.
