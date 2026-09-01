"use client";

import { Check, Copy, Link as LinkIcon, Loader2, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type Article = {
  url: string;
  title: string;
  summary: string;
};

const STORAGE_KEY = "sumz.articles";

export default function Summarizer() {
  const [url, setUrl] = useState("");
  const [current, setCurrent] = useState<Article | null>(null);
  const [history, setHistory] = useState<Article[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(stored)) setHistory(stored);
    } catch {
      // ignore malformed localStorage content
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setCurrent(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const article: Article = { url, title: data.title, summary: data.summary };
      setCurrent(article);

      const updated = [article, ...history.filter((a) => a.url !== url)];
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedUrl(value);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <section className="mt-16 w-full max-w-xl">
      <div className="flex flex-col w-full gap-2">
        <form className="relative flex justify-center items-center" onSubmit={handleSubmit}>
          <LinkIcon
            size={20}
            className="absolute left-0 my-2 ml-3 text-gray-400 pointer-events-none"
          />

          <input
            type="url"
            placeholder="Enter a URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="url_input peer"
          />

          <button
            type="submit"
            className="submit_btn peer-focus:border-gray-700 peer-focus:text-gray-700 dark:peer-focus:border-gray-300 dark:peer-focus:text-gray-300"
          >
            <Send size={16} />
          </button>
        </form>

        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.url}
              onClick={() => setCurrent(item)}
              className="link_card"
            >
              <div
                className="copy_btn text-gray-500 dark:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(item.url);
                }}
              >
                {copiedUrl === item.url ? <Check size={14} /> : <Copy size={14} />}
              </div>
              <p className="flex-1 font-fredoka text-blue-700 dark:text-blue-400 font-medium text-sm truncate">
                {item.url}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="my-10 max-w-full flex justify-center items-center">
        {isLoading ? (
          <Loader2 size={48} className="animate-spin text-orange-500" />
        ) : error ? (
          <p className="font-fredoka font-bold text-black dark:text-white text-center">
            Well, that wasn&apos;t supposed to happen...
            <br />
            <span className="font-fredoka font-normal text-gray-700 dark:text-gray-300">
              {error}
            </span>
          </p>
        ) : (
          current?.summary && (
            <div className="flex flex-col gap-3">
              <h2 className="font-fredoka font-bold text-gray-600 dark:text-gray-300 text-xl">
                Article <span className="blue_gradient">Summary</span>
              </h2>
              <div className="summary_box">
                <p className="font-fredoka font-medium text-base leading-relaxed text-gray-700 dark:text-gray-300">
                  {current.summary}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
