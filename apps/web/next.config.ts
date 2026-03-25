import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coloriage-magique.srv1465877.hstgr.cloud",
        pathname: "/api/v1/**",
      },
    ],
  },
};

export default nextConfig;
