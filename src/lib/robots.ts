const OUR_TOKEN = "sumzbot";
const ROBOTS_FETCH_TIMEOUT_MS = 5_000;

type Rule = { path: string; allow: boolean };

function parseRobotsTxt(text: string): Rule[] {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/#.*/, "").trim());

  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current: { agents: string[]; rules: Rule[] } | null = null;

  for (const line of lines) {
    if (!line) continue;
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const field = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (field === "user-agent") {
      // A run of consecutive User-agent lines (no rules seen yet) belongs to one group.
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (field === "disallow" && current && value) {
      current.rules.push({ path: value, allow: false });
    } else if (field === "allow" && current && value) {
      current.rules.push({ path: value, allow: true });
    }
  }

  const ourGroup = groups.find((g) => g.agents.some((a) => a !== "*" && OUR_TOKEN.includes(a)));
  const wildcardGroup = groups.find((g) => g.agents.includes("*"));
  return (ourGroup ?? wildcardGroup)?.rules ?? [];
}

/** Fails open (returns not-disallowed) if robots.txt is missing or unreachable, per convention. */
export async function isDisallowedByRobots(url: URL, userAgent: string): Promise<boolean> {
  const robotsUrl = new URL("/robots.txt", url.origin);

  let text: string;
  try {
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(ROBOTS_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    text = await res.text();
  } catch {
    return false;
  }

  const rules = parseRobotsTxt(text);
  const path = url.pathname + url.search;

  let best: Rule | null = null;
  for (const rule of rules) {
    if (path.startsWith(rule.path) && (!best || rule.path.length > best.path.length)) {
      best = rule;
    }
  }

  return best ? !best.allow : false;
}
