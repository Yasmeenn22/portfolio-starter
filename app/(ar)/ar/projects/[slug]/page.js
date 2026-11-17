import { notFound } from "next/navigation";
import { getCv } from "@/data/cv";
import { buildMetadata } from "@/lib/site";
import ProjectPage from "@/components/ProjectPage";

const LANG = "ar";

// A static site needs every page at build time: one per project in the CV.
export function generateStaticParams() {
  return getCv(LANG).projects.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params; // params is a Promise in Next.js 15+
  const p = getCv(LANG).projects.find((x) => x.slug === slug);
  if (!p) return {};
  return buildMetadata(LANG, { title: p.name, description: p.result, path: `/projects/${slug}/` });
}

export default async function Project({ params }) {
  const { slug } = await params;
  if (!getCv(LANG).projects.some((p) => p.slug === slug)) notFound();
  return <ProjectPage lang={LANG} slug={slug} />;
}
