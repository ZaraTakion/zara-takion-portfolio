import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "../site/styles/aqua-workstation.css";
import "./styles/upgrade.css";

document.documentElement.classList.add("js");
const locale = document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "pt";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App locale={locale} />
  </React.StrictMode>,
);
