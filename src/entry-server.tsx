import { renderToString } from "react-dom/server";
import { App } from "./v42/App";
import type { Locale } from "./v42/content";
export function render(locale: Locale) {
  return renderToString(<App locale={locale} />);
}
