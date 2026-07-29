import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Siden hostes på GitHub Pages under /bryllup-2027/.
// Bygget legges i docs/ på main-grenen, som Pages serverer direkte.
export default defineConfig({
  base: "/bryllup-2027/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "docs",
  },
});
