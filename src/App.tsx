import { Layout } from "./components/Layout";
import { findVariant } from "./data/catalogue";
import { hrefFor, useRoute } from "./router";
import { Banners } from "./components/Banners";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { Welcome } from "./components/Welcome";
import { Catalogue } from "./screens/Catalogue";
import { Help } from "./screens/Help";
import { Knit } from "./screens/Knit";
import { Plan } from "./screens/Plan";
import { Sections } from "./screens/Sections";
import { Settings } from "./screens/Settings";
import { StoreProvider } from "./state/AppContext";

export function App() {
  const route = useRoute();
  let title = "Knitting Clue Tracker";
  let back: string | undefined;
  let body;
  switch (route.name) {
    case "catalogue":
      body = <><Banners /><Catalogue /></>;
      break;
    case "settings":
      title = "Settings"; back = hrefFor.catalogue();
      body = <Settings initialMkal={route.mkalId} />;
      break;
    case "help":
      title = "Help"; back = hrefFor.catalogue();
      body = <Help />;
      break;
    default: {
      const found = findVariant(route.clueId);
      title = found ? `${found.clue.title}${found.variant.name ? ` · ${found.variant.name}` : ""}` : "Clue not found";
      back = hrefFor.catalogue();
      body = found ? (route.name === "plan" ? <Plan clueId={route.clueId} /> : route.name === "knit" ? <Knit clueId={route.clueId} /> : <Sections clueId={route.clueId} />) : <p>This clue is not in the app. <a href={hrefFor.catalogue()}>Back to the catalogue</a></p>;
    }
  }
  return (
    <StoreProvider>
      <Layout route={route} title={title} back={back}>{body}</Layout>
      <Welcome />
      <UpdatePrompt />
    </StoreProvider>
  );
}
