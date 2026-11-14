import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/public-learning";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/learn/"],
      disallow: ["/api/", "/dashboard/", "/planner/", "/profile/", "/teacher/", "/contests/*/attempt", "/sign-in/", "/sign-up/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
