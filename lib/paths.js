// Language-aware paths. English lives at /, Arabic at /ar/.
import { withBase } from "@/lib/withBase";

export const LANGS = ["en", "ar"];

export function localePath(lang, path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return lang === "ar" ? `/ar${clean === "/" ? "/" : clean}` : clean;
}

// Strip the base path and the /ar prefix: "/repo/ar/projects/x/" -> "/projects/x/"
export function neutralPath(pathname) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  let p = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  if (!p.startsWith("/")) p = `/${p}`;
  if (p === "/ar" || p === "/ar/") return "/";
  if (p.startsWith("/ar/")) p = p.slice(3);
  return p;
}

export const cvHref = (cv) => withBase(`/${cv.cvFile}`);
