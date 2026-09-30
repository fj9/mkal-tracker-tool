import { Layout } from "./components/Layout";
import { findVariant } from "./data/catalogue";
import { hrefFor, useRoute } from "./router";
import { Catalogue } from "./screens/Catalogue";
import { Plan } from "./screens/Plan";
import { StoreProvider } from "./state/AppContext";

function Placeholder({ name }: { name: string }) {
  return <p className="muted">{name} is coming next.</p>;
}

export function App() {
  const route = useRoute();
  let title = "Knitting Clue Tracker";
  let back: string | undefined;
  let body;
  switch (route.name) {
    case "catalogue":
      body = <Catalogue />;
      break;
    case "settings":
      title = "Settings"; back = hrefFor.catalogue();
      body = <Placeholder name="Settings" />;
      break;
    case "help":
      title = "Help"; back = hrefFor.catalogue();
      body = <Placeholder name="Help" />;
      break;
    default: {
      const found = findVariant(route.clueId);
      title = found ? `${found.clue.title}${found.variant.name ? ` · ${found.variant.name}` : ""}` : "Clue not found";
      back = hrefFor.catalogue();
      body = found ? (route.name === "plan" ? <Plan clueId={route.clueId} /> : <Placeholder name={route.name} />) : <p>This clue is not in the app. <a href={hrefFor.catalogue()}>Back to the catalogue</a></p>;
    }
  }
  return (
    <StoreProvider>
      <Layout route={route} title={title} back={back}>{body}</Layout>
    </StoreProvider>
  );
}
