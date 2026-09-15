import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import YAML from "yaml";

const src = path.resolve(__dirname, "src");

export default defineConfig({
  optimizeDeps: {
    // Prepare the music page's icons before its lazy route is first opened.
    include: ["react-icons/fa"],
  },
  plugins: [
    react(),
    {
      name: "language-data",
      transform(code, id) {
        if (!id.replaceAll("\\", "/").endsWith("/src/data/languages.yaml")) return;
        return { code: `export default ${JSON.stringify(YAML.parse(code))};`, map: null };
      },
    },
  ],
  server: {
    proxy: {
      "/api": {
        target: process.env.API_BASE_ORIGIN ?? "http://localhost:3005",
        changeOrigin: true,
      },
      "/game-builds": {
        target: process.env.API_BASE_ORIGIN ?? "http://localhost:3005",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: src },
      {
        find: "next/dynamic",
        replacement: path.resolve(src, "compat/next-dynamic.tsx"),
      },
      {
        find: "next/image",
        replacement: path.resolve(src, "compat/next-image.tsx"),
      },
      {
        find: "next/navigation",
        replacement: path.resolve(src, "compat/next-navigation.ts"),
      },
      { find: "next-intl", replacement: path.resolve(src, "compat/next-intl.tsx") },
      {
        find: "bioloom-ui",
        replacement: path.resolve(__dirname, "packages/bioloom-ui/src/index.ts"),
      },
      {
        find: "bioloom-miniplayer",
        replacement: path.resolve(
          __dirname,
          "packages/bioloom-miniplayer/src/index.ts",
        ),
      },
    ],
  },
});
