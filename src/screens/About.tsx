import aboutMd from "../../content/help/about.md?raw";
import { parseParagraphs } from "../lib/paragraphs";

const paragraphs = parseParagraphs(aboutMd);

export function About() {
  return (
    <section className="card">
      <h2>Hello</h2>
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.map((part, j) =>
            part.href ? (
              <a key={j} href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>
            ) : (
              <span key={j}>{part.text}</span>
            ),
          )}
        </p>
      ))}
    </section>
  );
}
