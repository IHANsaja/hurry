import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // The ad form accepts up to 5 images at 2 MB each (see adImageSchema),
    // which the 1 MB Server Action default rejects. 11 MB covers that plus
    // multipart boundary and field overhead.
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
