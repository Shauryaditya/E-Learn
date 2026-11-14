import type { MetadataRoute } from "next";

import { getPublicLearningCatalog, publicHubHref, SITE_URL } from "@/lib/public-learning";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hubs = await getPublicLearningCatalog();
  const now = new Date();
  const learningPages = hubs.flatMap((hub) => {
    const hubHref = publicHubHref(hub);
    return [
      { url: `${SITE_URL}${hubHref}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 },
      ...hub.chapters.map((chapter) => ({ url: `${SITE_URL}${hubHref}/${chapter.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ];
  });

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/learn`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...learningPages,
  ];
}
