import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isCapacitor = process.env.CAPACITOR_BUILD === "true";

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Strip crossorigin attributes for Capacitor — WKWebView can't load local files with it
    isCapacitor && {
      name: 'strip-crossorigin',
      transformIndexHtml(html: string) {
        return html.replace(/\s+crossorigin/g, '');
      },
    },
    // Disable PWA/service worker for Capacitor builds (native app doesn't need it)
    !isCapacitor &&
      VitePWA({
        registerType: "autoUpdate",
        manifest: false, // Use existing public/manifest.json
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
  ].filter(Boolean),
  build: {
    // Disable modulepreload polyfill — not needed in Capacitor's WKWebView
    modulePreload: { polyfill: false },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
});
