import type { MetadataRoute } from "next";

import { productConfig } from "@/config/product";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/api/", "/auth/", "/share/"],
    },
    sitemap: new URL("/sitemap.xml", productConfig.domain).toString(),
    host: productConfig.domain,
  };
}

