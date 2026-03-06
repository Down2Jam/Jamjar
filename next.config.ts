import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import { RemotePattern } from "next/dist/shared/lib/image-config";

// -- Plugins --
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();
const plugins = [withAnalyzer, withNextIntl];

// -- Remote Image Patterns --
// Allow images from any https site
const remotePatterns: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "**",
  },
];

// Allow images from the local machine (covers dev/staging configs)
remotePatterns.push(
  {
    protocol: "http",
    hostname: "localhost",
  },
  {
    protocol: "http",
    hostname: "127.0.0.1",
  }
);

// -- Base config --
const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    unoptimized: true,
  },
  transpilePackages: ["bioloom-ui", "bioloom-miniplayer"],
};

// -- Apply and export --
const applyPlugins = (config: NextConfig) =>
  plugins.reduce((acc, plugin) => plugin(acc), config);

export default applyPlugins(nextConfig);
