# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Full rebuild of the project on **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**, replacing the original Vite + React + Redux Toolkit Query stack.
- Replaced the third-party **RapidAPI "Article Extractor and Summarizer"** endpoint (discontinued/unreliable on the free tier) with a self-hosted extraction pipeline: server-side fetch + [`@mozilla/readability`](https://github.com/mozilla/readability) for content extraction, and the **Google Gemini API** (`gemini-3.6-flash`) for summarization.
- Article history is still stored client-side in `localStorage`; no database or authentication has been introduced.
- Replaced the Inter/Satoshi font pairing with **Fredoka** site-wide, self-hosted and optimized via `next/font/google`.
- Hero headline now reads "Summarize Articles with SUMZ" instead of naming the backend model directly.

### Added

- `POST /api/summarize` route handler: validates the submitted URL, extracts readable article text server-side, and returns an AI-generated summary.
- `.env.example` documenting the required `GEMINI_API_KEY`.
- Light/dark theme with system-preference default and a manual toggle (`next-themes`).
- Per-IP rate limiting (10 req/min) on `/api/summarize`.
- SSRF hardening: resolves and rejects loopback/private/link-local target hosts before fetching ([`src/lib/ssrf.ts`](src/lib/ssrf.ts)).
- `robots.txt` compliance check before fetching a target page ([`src/lib/robots.ts`](src/lib/robots.ts)).

### Fixed

- Article extraction now anchors Readability's parsing to the final redirected URL (`response.url`) instead of the originally-submitted URL, so shortened links resolve relative content correctly.
- Swapped the Gemini model from `gemini-2.5-flash` to `gemini-3.6-flash` — the former started returning `404 (no longer available to new users)` on a freshly issued API key.
- Replaced the hand-rolled icon SVGs (`link.svg`, `send.svg`, `copy.svg`, `tick.svg`, `loader.svg`) — rendered via `next/image`, which doesn't let `currentColor` cascade into an externally-referenced image — with `lucide-react` inline icon components, fixing icons that were invisible in dark mode.
- Fixed the Gemini prompt and response handling so occasional stray markdown (`**bold**`, a leading "Summary:" label) from the model no longer leaks into the displayed summary as literal asterisks — the prompt now asks for plain prose, and the response is sanitized server-side as a fallback ([`src/lib/gemini.ts`](src/lib/gemini.ts)).
- Fixed the `--font-inter` theme token, which was hardcoded to the literal string `"Inter", sans-serif` instead of the `next/font`-generated CSS variable — the self-hosted Inter font was being loaded but never actually applied. Moot now that the whole site uses Fredoka, but worth noting as a `next/font` + Tailwind v4 gotcha.
- Increased the summary text size (`text-sm` → `text-base`, added `leading-relaxed`) for readability.

## Legacy (pre-rebuild)

The original Vite/React/Redux Toolkit Query version of this project (`ai-summarizer`) is preserved in this repository's git history prior to the rebuild commit. It called the RapidAPI Article Extractor and Summarizer endpoint directly from the client.
