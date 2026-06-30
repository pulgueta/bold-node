import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/adapters/next.ts",
    "./src/adapters/hono.ts",
    "./src/adapters/express.ts",
    "./src/adapters/tanstack.ts"
  ],
  outDir: "dist",
  format: "esm",
  clean: true,
  minify: true,
  platform: "node",
  treeshake: true,
  splitting: true,
  minifySyntax: true,
  dts: true,
  external: ["zod", "express", "hono"]
});
