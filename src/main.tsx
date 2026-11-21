import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { registerServiceWorker } from "./app/pwa";
import "./styles/index.css";

// One-time stale state cleanup on app init
if (typeof localStorage !== "undefined") {
  try {
    localStorage.removeItem("parlance.avatarGender");
    const raw = localStorage.getItem("parlance.settings.v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state && "avatarGender" in parsed.state) {
        delete parsed.state.avatarGender;
        localStorage.setItem("parlance.settings.v1", JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
}

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
