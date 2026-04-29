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
  define: {
    "process.env.NEXT_PUBLIC_API": JSON.stringify(
      process.env.VITE_PUBLIC_API ?? process.env.NEXT_PUBLIC_API ?? "",
    ),
    "process.env.NEXT_PUBLIC_MODE": JSON.stringify(
      process.env.VITE_PUBLIC_MODE ?? process.env.NEXT_PUBLIC_MODE ?? "",
    ),
  },
  resolve: {
    alias: [
      { find: "@", replacement: src },
      {
        find: "next/dynamic",
        replacement: path.resolve(src, "compat/next-dynamic.tsx"),
      },
      {
        find: "next/font/google",
        replacement: path.resolve(src, "compat/next-font-google.ts"),
      },
      {
        find: "next/headers",
        replacement: path.resolve(src, "compat/next-headers.ts"),
      },
      {
        find: "next/image",
        replacement: path.resolve(src, "compat/next-image.tsx"),
      },
      {
        find: "next/link",
        replacement: path.resolve(src, "compat/next-link.tsx"),
      },
      {
        find: "next/navigation",
        replacement: path.resolve(src, "compat/next-navigation.ts"),
      },
      {
        find: "next-intl/server",
        replacement: path.resolve(src, "compat/next-intl-server.ts"),
      },
      { find: "next-intl", replacement: path.resolve(src, "compat/next-intl.tsx") },
      { find: "next", replacement: path.resolve(src, "compat/next.ts") },
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
