/** Normalize RFC 5322 Message-ID: strip whitespace and angle brackets. */
export function normalizeMessageId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^<|>$/g, "").trim() || null;
}

export function parseReferences(
  raw: string | string[] | null | undefined,
): string[] {
  if (!raw) return [];
  const text = Array.isArray(raw) ? raw.join(" ") : raw;
  const matches = text.match(/<[^>]+>/g);
  if (!matches) {
    return text
      .split(/\s+/)
      .map((p) => normalizeMessageId(p))
      .filter((x): x is string => Boolean(x));
  }
  return matches
    .map((m) => normalizeMessageId(m))
    .filter((x): x is string => Boolean(x));
}

type AddrLike =
  | string
  | { text?: string; value?: Array<{ address?: string; name?: string }> }
  | Array<{ address?: string; name?: string }>
  | Array<{ text?: string; value?: Array<{ address?: string; name?: string }> }>
  | null
  | undefined;

/** Format mailparser AddressObject(s) into a single display string. */
export function formatAddrs(value: AddrLike): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if ("text" in item && item.text) return item.text;
        if ("value" in item && item.value) return formatAddrs(item.value);
        if ("address" in item || "name" in item) {
          const a = item as { address?: string; name?: string };
          return a.name ? `${a.name} <${a.address ?? ""}>` : (a.address ?? "");
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }
  if (value.text) return value.text;
  if (value.value) return formatAddrs(value.value);
  return "";
}
