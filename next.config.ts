import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true, // enables styled-components SWC transform
  },
  // you can add other options here later (images, redirects, etc.)
};

export default nextConfig;
