import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      ...(process.env.NEXT_PUBLIC_MODE === "DEV"
        ? [
            {
              protocol: "http" as "http",
              hostname: "localhost",
            },
          ]
        : []),
    ],
  },
};

export default withAnalyzer(nextConfig);
