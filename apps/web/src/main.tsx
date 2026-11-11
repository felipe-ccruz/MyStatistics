import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Providers } from "./app/providers";
import { AppRouter } from "./app/router";
import { applyTheme, readStoredTheme } from "./lib/theme";
import "./fonts";
import "./index.css";

// index.html already applies the saved theme before the first paint; this keeps
// TypeScript as the source of truth if that inline script ever goes away.
applyTheme(readStoredTheme());

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element in index.html");

createRoot(root).render(
  <StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </StrictMode>,
);
