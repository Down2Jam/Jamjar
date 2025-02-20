import type { NextConfig } from "next";

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

export default nextConfig;
