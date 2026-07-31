import type { MetadataRoute } from "next";

import { productConfig } from "@/config/product";
import { caseStudies } from "@/content/case-studies";
import { features } from "@/content/features";
import { resources } from "@/content/resources";

const updated = new Date("2026-07-23T00:00:00.000Z");

function absolute(path: string) {
  return new URL(path, productConfig.domain).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: Array<{
    path: string;
    changeFrequency: "weekly" | "monthly" | "yearly";
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/features", changeFrequency: "monthly", priority: 0.9 },
    { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
    { path: "/scan", changeFrequency: "monthly", priority: 0.9 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
    { path: "/case-studies", changeFrequency: "monthly", priority: 0.7 },
    { path: "/resources", changeFrequency: "weekly", priority: 0.8 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
    { path: "/about", changeFrequency: "yearly", priority: 0.5 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absolute(route.path),
      lastModified: updated,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...features.map((feature) => ({
      url: absolute(`/features/${feature.slug}`),
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...caseStudies.map((study) => ({
      url: absolute(`/case-studies/${study.slug}`),
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...resources.map((resource) => ({
      url: absolute(`/resources/${resource.slug}`),
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

