import { fileURLToPath, URL } from "node:url";
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  publicDir: '../books',
  resolve: {
    alias: {
      "lucide-solid/icons": fileURLToPath(
        new URL(
          "./node_modules/lucide-solid/dist/source/icons",
          import.meta.url,
        ),
      ),
    },
  },
})
