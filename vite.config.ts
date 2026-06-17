import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const src = path.resolve(__dirname, "src");

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
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
