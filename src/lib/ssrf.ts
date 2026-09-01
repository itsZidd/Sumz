import { promises as dns } from "node:dns";

export class SsrfError extends Error {}

function isPrivateIPv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // RFC1918 private
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918 private
  if (a === 192 && b === 168) return true; // RFC1918 private
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata (169.254.169.254)
  if (a === 0) return true; // "this" network
  return false;
}

function isPrivateIPv6(ip: string) {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true; // loopback / unspecified
  if (normalized.startsWith("fe80:")) return true; // link-local
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local (fc00::/7)

  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

function isPrivateIp(ip: string) {
  return ip.includes(":") ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

/**
 * Resolves the hostname and rejects if it (or any of its resolved addresses)
 * points at a loopback/private/link-local address. This is a pre-flight check —
 * it doesn't pin the resolved IP for the actual fetch, so it doesn't fully
 * close DNS-rebinding attacks (an attacker-controlled DNS server could answer
 * differently on the second lookup `fetch()` itself performs).
 */
export async function assertPublicHostname(url: URL) {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost") {
    throw new SsrfError("That URL points to a local address and can't be fetched.");
  }

  let addresses: string[];
  try {
    const results = await dns.lookup(hostname, { all: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new SsrfError("Could not resolve that URL's host.");
  }

  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    throw new SsrfError("That URL points to a private/internal network address and can't be fetched.");
  }
}
