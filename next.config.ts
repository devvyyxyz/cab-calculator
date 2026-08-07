import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai"],
  // Allow external image domains for Roblox avatars and brainrot icons
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "tr.rbxcdn.com" },
      { protocol: "https", hostname: "indieun.com" },
    ],
  },
};

export default nextConfig;
