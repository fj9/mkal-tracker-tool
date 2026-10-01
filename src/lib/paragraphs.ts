export type Inline = { text: string; href?: string };

/** Splits copy into paragraphs, and each paragraph into plain text and [text](url) links. */
export function parseParagraphs(md: string): Inline[][] {
  return md
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const parts: Inline[] = [];
      const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
      let last = 0;
      for (let m = re.exec(p); m; m = re.exec(p)) {
        if (m.index > last) parts.push({ text: p.slice(last, m.index) });
        parts.push({ text: m[1], href: m[2] });
        last = m.index + m[0].length;
      }
      if (last < p.length) parts.push({ text: p.slice(last) });
      return parts;
    });
}
