export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}

export function normalizeHexColor(value: string): string {
  if (value.length === 4) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return value.toLowerCase();
}

export function isValidIsoDate(value: string): boolean {
  if (typeof value !== "string" || value.trim() === "") return false;
  const time = Date.parse(value);
  return Number.isFinite(time);
}

/**
 * Picks black or white text based on WCAG relative luminance of the
 * background so the countdown stays readable on any user-chosen color.
 */
export function readableTextColor(hexColor: string): "#111111" | "#ffffff" {
  const hex = normalizeHexColor(hexColor).slice(1);
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);

  return luminance > 0.5 ? "#111111" : "#ffffff";
}

export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}
