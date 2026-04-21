import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 5173, // ← forcer le port 5173, pas 3000
      host: "localhost",
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
