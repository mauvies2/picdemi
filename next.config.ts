import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
    proxyClientMaxBodySize: "500mb",
  },
  images: {
    remotePatterns: (() => {
      const patterns = [
        {
          protocol: "https" as const,
          hostname: "placehold.co",
        },
      ];
      // Allow Supabase storage signed URLs
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          const hostname = new URL(supabaseUrl).hostname;
          patterns.push({
            protocol: "https" as const,
            hostname,
          });
        }
      } catch {
        // ignore if env is missing or malformed
      }
      return patterns;
    })(),
  },
};

export default nextConfig;
