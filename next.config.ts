import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default Server Action body limit is 1MB, which silently rejects any
    // staff photo upload (phone photos routinely run 2-8MB). Multiple
    // photos per request need headroom above the per-file MAX_PHOTO_BYTES
    // in app/[hotelSlug]/staff/actions.ts (8MB) plus multipart overhead.
    serverActions: {
      bodySizeLimit: "40mb",
    },
  },
};

export default nextConfig;
