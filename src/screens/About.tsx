import aboutMd from "../../content/help/about.md?raw";
import { GOATCOUNTER_CODE } from "../lib/analytics";
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
      {GOATCOUNTER_CODE && (
        <p className="small muted">
          I use <a href="https://www.goatcounter.com" target="_blank" rel="noopener noreferrer">GoatCounter</a>, a simple counter that sets no cookies, to see roughly how many people visit and which pages they open. It never sees what you tick.
        </p>
      )}
    </section>
  );
}
