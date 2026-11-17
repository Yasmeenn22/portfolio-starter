import { getUi } from "@/data/ui";
import { localePath } from "@/lib/paths";

// Where the site is published (GitHub Pages: https://<user>.github.io/<repo>/).
// Change NEXT_PUBLIC_SITE_ORIGIN if you move to a custom domain.
const ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://yasmeenn22.github.io";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const siteUrl = (path) => `${ORIGIN}${BASE}${path}`;

export function buildMetadata(lang, { title, description, path = "/" } = {}) {
  const t = getUi(lang);
  const fullTitle = title ? `${title} | ${t.meta.title.split(" | ")[0]}` : t.meta.title;
  const desc = description || t.meta.description;
  return {
    metadataBase: new URL(ORIGIN),
    title: fullTitle,
    description: desc,
    alternates: {
      canonical: siteUrl(localePath(lang, path)),
      languages: { en: siteUrl(localePath("en", path)), ar: siteUrl(localePath("ar", path)) },
    },
    openGraph: {
      title: fullTitle,
      description: desc,
      type: "website",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      url: siteUrl(localePath(lang, path)),
    },
    twitter: { card: "summary", title: fullTitle, description: desc },
  };
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
  ],
};

// Runs before the first paint: the saved theme, or the system one, with no flash.
export const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
