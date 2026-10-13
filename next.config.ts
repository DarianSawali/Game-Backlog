import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.cloudflare.steamstatic.com",
        pathname: "/steam/apps/**",
      },
      {
        protocol: "https",
        hostname: "media.steampowered.com",
        pathname: "/steamcommunity/public/images/apps/**",
      },
    ],
  },
};

export default nextConfig;
