import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds the calculator as one HTML file that saves in the browser (npm run calculator:build → dist/kalkulator.html).
// Independent of the Next.js app on Vercel; it reuses the calculator's components from src/features/calculator.
export default defineConfig({
  root: fileURLToPath(new URL("./src/standalone/calculator", import.meta.url)),
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      // The components use next-intl, which only works inside Next.js. use-intl is what it is built on, same hooks.
      { find: /^next-intl$/, replacement: "use-intl" },
    ],
  },
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL("./src/standalone/calculator/kalkulator.html", import.meta.url)) },
  },
});
