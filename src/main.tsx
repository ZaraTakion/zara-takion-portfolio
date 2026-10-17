import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./v42/App";
import { getLocale } from "./v42/content";
const root = document.getElementById("root")!;
const app = <App locale={getLocale(window.location.pathname)} />;
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
