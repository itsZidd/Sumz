# 📝 Sumz — AI Article Summarizer

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Gemini AI](https://img.shields.io/badge/Google_Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel_Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)

**Sumz** is a small tool that turns any article URL into a short AI-generated summary. Paste a link, and it fetches the page, extracts the readable article text itself (no third-party extraction API), and summarizes it with **Google Gemini**.

---

## 🚀 What's Built

- **URL-to-Summary Pipeline**: Paste any article URL and get a 3–4 sentence AI summary back in seconds.
- **Self-Hosted Extraction**: Article content is fetched and parsed server-side with Mozilla's Readability — no dependency on a third-party "extractor" API.
- **Local History**: Previously summarized URLs are kept in `localStorage` so you can revisit a past summary or copy the original link.
- **Copy to Clipboard**: One click to copy any past article URL back out.
- **Graceful Error Surfacing**: Unreachable URLs, non-HTML pages, JS-rendered pages with no static content, and Gemini failures each return a specific, readable error instead of a silent failure.
- **Rate Limiting**: `/api/summarize` caps each client to 10 requests/minute (in-memory, per IP) to keep one visitor from burning through the Gemini quota or hammering an arbitrary target host.
- **SSRF Hardening**: Before fetching, the target hostname is resolved and rejected if it points at loopback, private (RFC1918), or link-local addresses (including the `169.254.169.254` cloud metadata endpoint) — see [`src/lib/ssrf.ts`](src/lib/ssrf.ts).
- **robots.txt Compliance**: Checks the target site's `robots.txt` for the summarizer's user agent before fetching, and declines paths it disallows — see [`src/lib/robots.ts`](src/lib/robots.ts).
- **Light/Dark Theme**: Follows the visitor's OS preference by default, with a manual toggle that persists across visits.

## 🛠️ Tech Stack & Complete Tools Inventory

### 📦 Exhaustive Tools & Libraries Breakdown (Grouped by Role)

#### 1. Core Framework & Build Engine
| Package | Version | Purpose & Usage |
| :--- | :--- | :--- |
| **`next`** | `^16.3.4` | Next.js App Router — routing, SSR, and the `/api/summarize` route handler |
| **`react` / `react-dom`** | `^19.2.8` | UI runtime |
| **`typescript`** | `^5` | Type safety across the app and API routes |

#### 2. Styling & Theming
| Package | Version | Purpose & Usage |
| :--- | :--- | :--- |
| **`tailwindcss`** | `^4` | Utility-first CSS (Tailwind v4 engine) |
| **`@tailwindcss/postcss`** | `^4` | PostCSS plugin for Tailwind v4 |
| **`next-themes`** | `^0.4` | Light/dark theme switching with system-preference default and persistence |
| **`lucide-react`** | `^1.39` | Icon set — inline SVG components so icons pick up `currentColor` correctly in both themes (the original hand-off `<img>`-referenced SVGs didn't) |
| **Fredoka** (`next/font/google`) | — | Site-wide font — a rounded, playful display face, self-hosted and optimized via `next/font` |

#### 3. Article Extraction
| Package | Version | Purpose & Usage |
| :--- | :--- | :--- |
| **`linkedom`** | `^0.18.13` | Lightweight server-side DOM parser optimized for serverless/edge environments |
| **`@mozilla/readability`** | `^0.6.0` | Extracts clean article title/text from a parsed DOM, the same engine behind Firefox Reader View |

#### 4. AI Summarization
| Package | Version | Purpose & Usage |
| :--- | :--- | :--- |
| **`@google/genai`** | `^2.20.0` | Official Google GenAI SDK, used in [`src/lib/gemini.ts`](src/lib/gemini.ts) to call `gemini-2.5-flash` |

#### 5. Hosting & Deployment
| Package | Version | Purpose & Usage |
| :--- | :--- | :--- |
| *(Vercel)* | — | Zero-config deployment target for Next.js; no adapter package required |

#### 6. Code Quality
| Package | Version | Purpose & Usage |
| :--- | :--- | :--- |
| **`eslint`** | `^9` | Linter engine |
| **`eslint-config-next`** | `^16.3.4` | Next.js's recommended ESLint rules |

---

## 📖 Engineering Notes

### 🕰️ 0. Origins (2023)

Sumz was originally built in 2023, not long after OpenAI's `gpt-3.5-turbo` API first went public — it was the first project where I used any AI/LLM capability in my programming history. That original version was a Vite + React app that called a RapidAPI-hosted article extractor/summarizer wrapping the model, rather than talking to an LLM directly.

### 💬 1. Why We Rebuilt (and Left RapidAPI)

The original version of this project (`ai-summarizer`) was a Vite + React app using Redux Toolkit Query to call the **RapidAPI "Article Extractor and Summarizer"** endpoint directly from the browser, with the API key shipped in a client-side `VITE_*` env var. That third-party endpoint stopped working reliably — a common failure mode for free-tier RapidAPI mirrors — and there was no way to fix it without owning the extraction step.

Two things drove the rebuild specifically now: wanting to move onto a **free-tier LLM API** (Google AI Studio's Gemini, rather than a paid/rate-limited OpenAI-backed proxy), and needing to actually fix the dead crawler instead of hoping a third party's endpoint comes back.

Rebuilding on **Next.js** solves both problems at once: the App Router gives the project a real server (a route handler at `/api/summarize`) to fetch pages and call an LLM without exposing any key to the client, and it replaces a single external dependency that could disappear at any time with a pipeline built from parts we control.

### 💡 2. Extraction-Then-Summarize, Not "Just Ask the Model for the URL"

Some Gemini model/tooling combinations can fetch a URL themselves, but that path is opaque — no control over what got read, how paywalls or cookie walls were handled, or how much of the page's boilerplate leaked into the prompt. Instead, [`src/lib/extract.ts`](src/lib/extract.ts) fetches the page HTML directly and runs it through `linkedom` + `@mozilla/readability` (the same library behind Firefox's Reader View) to isolate the actual article text before it ever reaches Gemini. This keeps the extraction step inspectable, debuggable, and independent of whichever model is doing the summarizing in [`src/lib/gemini.ts`](src/lib/gemini.ts).

---

## ⚠️ Known Limitations

1. **No JavaScript Rendering**: Extraction is a plain server-side `fetch` — sites that render their article body via client-side JavaScript (many SPAs) will return no readable content. A headless-browser fallback (e.g. Playwright) would be needed to cover those.
2. **No Paywall Handling**: Paywalled or login-gated articles will extract only whatever HTML is served before the wall.
3. **Gemini Free-Tier Rate Limits**: The free Google AI Studio tier caps requests per minute/day; heavy use will hit `429`s, surfaced as a generic summarization error.
4. **No Persistence Beyond the Browser**: History lives in `localStorage` only — clearing site data or switching devices loses it. There's no account system or server-side storage.
5. **Bot-Protected URL Shorteners Fail**: Redirects are followed automatically, so most shortened links resolve fine. Shorteners fronted by bot-detection (TinyURL, confirmed by testing) return `403` to any non-browser request regardless of User-Agent, which surfaces as "Page responded with 403." There's no workaround short of a headless browser.
6. **Rate Limiting Is Per-Instance, Not Distributed**: The 10 req/min cap in [`src/lib/rateLimit.ts`](src/lib/rateLimit.ts) lives in server memory. On a single long-running process (e.g. `npm start`, one Vercel instance) it works as expected; across multiple serverless instances it wouldn't share state, so the effective limit could be higher than 10/min. A shared store (e.g. Upstash Redis) would be needed for a true distributed limit.
7. **SSRF Check Doesn't Fully Close DNS Rebinding**: [`src/lib/ssrf.ts`](src/lib/ssrf.ts) resolves and validates the hostname *before* fetching, but the actual `fetch()` re-resolves DNS independently. A malicious DNS server could theoretically answer differently between the two lookups (a "DNS rebinding" attack) to slip a private address past the check. Fully closing this needs a custom fetch dispatcher that pins the validated IP for the real connection.

---

## ⚙️ Environment Variables Configuration (`.env`)

Create a `.env` file in the root directory (see [`.env.example`](.env.example)):

```env
# Google Gemini API key — free tier available at https://aistudio.google.com/apikey
GEMINI_API_KEY="your-google-gemini-api-key"
```

---

## 🚀 Local Setup & Deployment

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Run type check and build validation
npx tsc --noEmit
npm run build
```

To deploy to **Vercel**:
1. Connect your repository to **Vercel**.
2. Add `GEMINI_API_KEY` in **Project Settings ➔ Environment Variables**.
3. Deploy!

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full history of releases, fixes, and changes.

## 📄 License

Released under the [MIT License](./LICENSE).
