// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path"; // <--- IMPORT THIS LINE

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/public/**",
      "**/coverage/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,pnpm-lock}.config.*",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@composables": path.resolve(__dirname, "./src/composables"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@enums": path.resolve(__dirname, "./src/enums"),
      "@rest": path.resolve(__dirname, "./src/rest"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },
});
