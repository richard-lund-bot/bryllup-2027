import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Siden hostes på GitHub Pages under /bryllup-2027/
export default defineConfig({
  base: "/bryllup-2027/",
  plugins: [react(), tailwindcss()],
});
