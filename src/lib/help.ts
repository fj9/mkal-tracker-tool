export interface HelpItem { title: string; body: string }

/** Parses "## Title" followed by paragraphs into items. Keeps help copy in markdown files. */
export function parseHelp(md: string): HelpItem[] {
  return md
    .split(/^## /m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [title, ...rest] = chunk.split("\n");
      return { title: title.trim(), body: rest.join("\n").trim() };
    });
}
