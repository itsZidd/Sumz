import { NextResponse } from "next/server";
import { extractArticle, ExtractionError } from "@/lib/extract";
import { summarizeText, SummarizationError } from "@/lib/gemini";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(getClientKey(request.headers));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : null;

  if (!url) {
    return NextResponse.json({ error: "A URL is required." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "That's not a valid URL." }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only http/https URLs are supported." }, { status: 400 });
  }

  try {
    const article = await extractArticle(parsed.toString());
    const summary = await summarizeText(article.title, article.textContent);
    return NextResponse.json({ title: article.title, summary });
  } catch (err) {
    if (err instanceof ExtractionError || err instanceof SummarizationError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
