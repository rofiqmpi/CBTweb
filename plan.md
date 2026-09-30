# GreenHorizon implementation plan

## Product outcome
Create a polished, Bengali-first website where users can browse curated PC themes, search and filter them, open a detailed preview, download a theme, favorite it, and creators can submit a new theme through a simple upload flow.

## Architecture
- Browser-rendered React + TypeScript single-page application.
- Current repository already contains Vite/React tooling; preserve the existing package manifest and use local mock data with client state for this first usable marketplace experience.
- The gallery data contract is explicit in `src/App.tsx`: each theme contains id, title, category, description, creator, preview, accent, downloads, tags, and fileUrl.
- No backend API is required for this visual/product slice; submitted themes are added in client state and the browser download action is wired to a URL.

## Project structure
- `src/App.tsx`: app shell, data model, search/filter/sort state, theme detail dialog, upload dialog, toast feedback.
- `src/index.css`: design tokens, layout, responsive behavior, cards, dialogs, and motion.
- `public/logo.svg` and `public/favicon.svg`: project-specific GreenHorizon mark.
- `app.config.ts`: Web Dev project logo metadata when a durable logo URL is available.
- `ideas.md`: accepted visual direction and brand system.

## Delivery and caching
This is a browser-rendered frontend with no dynamic server route. Vite builds static output to `dist`; published traffic should serve the static output with SPA fallback for browser-managed routes. Public versioned assets can use long-lived caching; HTML should remain revalidated. Current preview validation uses the local development server on the repository's configured port.

## Required behaviors
1. Landing page contains a header with wordmark, nav anchors, creator upload CTA, an editorial hero, featured theme visual, and a browse section.
2. Browse supports free-text search, category filtering, and sort by newest/popular/name.
3. Cards expose preview, creator, category, tags, download count, favorite affordance, and download CTA.
4. Preview dialog shows larger details and a direct download action; download feedback is visible and counters update.
5. Upload dialog captures theme name, category, description, preview image URL, and theme file URL; submitted data appears immediately in the gallery with a success toast.
6. Layout remains usable on mobile and respects accessible labels, focusable buttons, and escape/backdrop dialog dismissal.

## Verification
- Run `npm run lint` for TypeScript diagnostics.
- Run `npm run build` for the production bundle.
- Inspect source and generated output for broken imports, missing assets, and expected routes.
