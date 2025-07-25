import typescript from '@rollup/plugin-typescript'

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.mjs",
      format: "esm",
    },
  ],
  external: [
    "vue",
    "vue-router",
    "axios",
    "@tanstack/vue-query",
    "@vueuse/core",
    "jwt-decode",
    "uuid",
  ],
  plugins: [typescript()],
};