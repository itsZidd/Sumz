import { GoogleGenAI } from "@google/genai";

export class SummarizationError extends Error {}

const MODEL = "gemini-3.6-flash";
const MAX_INPUT_CHARS = 20_000;

let client: GoogleGenAI | null = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new SummarizationError("GEMINI_API_KEY is not configured.");
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

function stripMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^\s*(summary|tl;dr)\s*:\s*/i, "")
    .trim();
}

export async function summarizeText(title: string, text: string) {
  const truncated = text.slice(0, MAX_INPUT_CHARS);

  const prompt = `Summarize the following article in 3-4 concise sentences. Stick to facts stated in the article, no outside commentary.

Respond in plain prose only: no markdown formatting, no asterisks or bold text, no headers, no bullet points, and no leading label like "Summary:".

Title: ${title}

Article:
${truncated}`;

  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const summary = response.text?.trim();
    if (!summary) {
      throw new SummarizationError("Gemini returned an empty summary.");
    }
    return stripMarkdown(summary);
  } catch (err) {
    if (err instanceof SummarizationError) throw err;
    console.error("[gemini] request failed:", err);
    throw new SummarizationError("Gemini request failed.");
  }
}
