import * as esbuild from "esbuild";

await esbuild.build({
  bundle: true,
  minify: true,
  entryPoints: ["./src/index.js"],
  outfile: "outfile.cjs",
  format: "cjs",
  platform: "node",
  target: "node14",
});
