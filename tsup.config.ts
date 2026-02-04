import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: "esm",
  clean: true,
  minify: true,
  platform: "node",
  treeshake: true,
  splitting: true,
  minifySyntax: true,
  dts: true
});
