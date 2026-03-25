/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
