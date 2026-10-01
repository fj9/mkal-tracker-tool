import { parseHelp } from "../lib/help";
import { useSettings } from "../state/AppContext";
import faqMd from "../../content/help/faq.md?raw";
import welcomeMd from "../../content/help/welcome.md?raw";

export const welcomeCards = parseHelp(welcomeMd);
const faq = parseHelp(faqMd);

export function Help() {
  const { update } = useSettings();
  return (
    <>
      <section className="card">
        <h2>Getting started</h2>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          {welcomeCards.map((c) => (
            <li key={c.title} style={{ marginBottom: 8 }}><strong>{c.title}</strong> {c.body}</li>
          ))}
        </ol>
        <button className="btn" style={{ marginTop: 8 }} onClick={() => { update({ welcomeSeen: false }); location.hash = "#/"; }}>Show the welcome cards again</button>
      </section>
      <section className="card">
        <h2>Questions and answers</h2>
        {faq.map((q) => (
          <details key={q.title} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, minHeight: 32 }}>{q.title}</summary>
            <p style={{ marginTop: 8 }}>{q.body}</p>
          </details>
        ))}
      </section>
    </>
  );
}
