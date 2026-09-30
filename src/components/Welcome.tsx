import { useState } from "react";
import { welcomeCards } from "../screens/Help";
import { useSettings } from "../state/AppContext";

/** Three welcome cards on first launch. */
export function Welcome() {
  const { settings, update, ready } = useSettings();
  const [i, setI] = useState(0);
  if (!ready || settings.welcomeSeen) return null;
  const card = welcomeCards[i];
  const last = i === welcomeCards.length - 1;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="w-title">
      <div className="sheet">
        <div className="small muted">{i + 1} of {welcomeCards.length}</div>
        <h2 id="w-title">{card.title}</h2>
        <p>{card.body}</p>
        <div className="row">
          <button className="btn" onClick={() => update({ welcomeSeen: true })}>Skip</button>
          <div className="grow" />
          <button className="btn primary" onClick={() => (last ? update({ welcomeSeen: true }) : setI(i + 1))}>{last ? "Start" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
