import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, // the floating "N" badge in development
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
