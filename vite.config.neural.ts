import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'strip-crossorigin',
      transformIndexHtml(html: string) {
        return html.replace(/\s+crossorigin/g, '');
      },
    },
  ],
  base: './',
  build: {
    outDir: 'dist-neural',
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: path.resolve(__dirname, 'neural-core.html'),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
