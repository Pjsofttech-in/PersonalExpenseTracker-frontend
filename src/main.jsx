import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import "./css/theme.css";

try {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
} catch (themeError) {}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
