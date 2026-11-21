import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { translationApi } from "./server/translationApi.js";
import { speechApi } from "./server/speechApi.js";
import { signSentenceApi } from "./server/signSentenceApi.js";
import { signVideoApi } from "./server/signVideoApi.js";
import { serviceWorkerSource } from "./server/serviceWorker.js";

const recognitionProxy = {
  "/recognition": {
    target: `http://127.0.0.1:${process.env.PARLANCE_API_PORT || 8000}`,
    ws: true,
    rewrite: (path: string) => path.replace(/^\/recognition/, ""),
  },
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "parlance-service-worker",
      apply: "build",
      generateBundle(_options, bundle) {
        const files = Object.keys(bundle).filter((file) => !file.endsWith(".map")).map((file) => `/${file}`);
        const shell = ["/index.html", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/signs/manifest.json"];
        const precache = [...new Set([...shell, ...files])];
        const version = String(precache.join("|").length) + "-" + Date.now().toString(36);
        this.emitFile({ type: "asset", fileName: "sw.js", source: serviceWorkerSource(precache, version) });
      },
    },
    {
      name: "parlance-translation-api",
      configureServer(server) {
        server.middlewares.use(translationApi);
        server.middlewares.use(speechApi);
        server.middlewares.use(signSentenceApi);
        server.middlewares.use(signVideoApi);
      },
      configurePreviewServer(server) {
        server.middlewares.use(translationApi);
        server.middlewares.use(speechApi);
        server.middlewares.use(signSentenceApi);
        server.middlewares.use(signVideoApi);
      },
    },
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { host: "127.0.0.1", port: Number(process.env.PARLANCE_PORT) || 4173, strictPort: true, proxy: recognitionProxy,
    watch: { ignored: ["**/.research-cache/**", "**/.venv/**"] } },
  preview: { host: "127.0.0.1", port: Number(process.env.PARLANCE_PORT) || 4173, strictPort: true, proxy: recognitionProxy },
  worker: { format: "es" },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/")) return "three";
          return undefined;
        },
      },
    },
  },
});
