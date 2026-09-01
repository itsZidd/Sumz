import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { assertPublicHostname } from "./ssrf";
import { isDisallowedByRobots } from "./robots";

export class ExtractionError extends Error {}

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; SumzBot/1.0; +https://github.com/itsZidd/Sumz)";

export async function extractArticle(url: string) {
  const target = new URL(url);

  try {
    await assertPublicHostname(target);
  } catch (err) {
    throw new ExtractionError(err instanceof Error ? err.message : "That URL can't be fetched.");
  }

  if (await isDisallowedByRobots(target, USER_AGENT)) {
    throw new ExtractionError("This site's robots.txt disallows automated access to that page.");
  }

  let response: Response;
  try {
    response = await fetch(target, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new ExtractionError("Could not reach that URL.");
  }

  if (!response.ok) {
    throw new ExtractionError(`Page responded with ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new ExtractionError("That URL doesn't point to an HTML page.");
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url: response.url });
  const article = new Readability(dom.window.document).parse();

  if (!article?.textContent?.trim()) {
    throw new ExtractionError(
      "Couldn't find readable article content on that page — it may render its content with JavaScript."
    );
  }

  return {
    title: article.title ?? "",
    textContent: article.textContent.trim(),
  };
}
