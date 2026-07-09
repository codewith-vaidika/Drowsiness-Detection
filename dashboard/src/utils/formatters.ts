/**
 * Format a date string into human-readable MM/DD/YYYY HH:MM:SS.
 */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";

  const pad = (n: number) => String(n).padStart(2, "0");

  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Return a relative time string like "2 minutes ago".
 */
export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

/**
 * Classify an alert's severity for row highlighting.
 * - "critical": occurred within the last 60 seconds OR duration >= 10s
 * - "warning":  occurred within the last 5 minutes OR duration >= 7s
 * - "normal":   everything else
 */
export function classifyAlert(
  timestamp: string,
  duration: number
): "critical" | "warning" | "normal" {
  const ageSec = (Date.now() - new Date(timestamp).getTime()) / 1000;

  if (ageSec < 60 || duration >= 10) return "critical";
  if (ageSec < 300 || duration >= 7) return "warning";
  return "normal";
}
