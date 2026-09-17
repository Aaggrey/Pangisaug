export function formatUGX(amount: number): string {
  return "UGX " + amount.toLocaleString("en-UG");
}

export function formatArea(sqm?: number | null): string {
  return sqm ? `${sqm.toLocaleString("en-UG")} m²` : "—";
}

export function timeAgo(date: Date | string): string {
  const then = new Date(date).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}