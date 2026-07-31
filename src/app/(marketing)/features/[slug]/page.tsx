import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FeaturePage } from "@/components/marketing/feature-page";
import { featureBySlug, features, type FeatureSlug } from "@/content/features";

export function generateStaticParams() {
  return features.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const feature = featureBySlug[slug as FeatureSlug];
  if (!feature) return {};

  return {
    title: feature.shortName,
    description: feature.description,
    alternates: { canonical: `/features/${feature.slug}` },
    openGraph: {
      title: feature.headline,
      description: feature.description,
      url: `/features/${feature.slug}`,
    },
  };
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = featureBySlug[slug as FeatureSlug];
  if (!feature) notFound();

  return <FeaturePage feature={feature} />;
}

