import { getCv } from "@/data/cv";
import { getUi } from "@/data/ui";
import { bidi } from "@/lib/bidi";

export default function Footer({ lang }) {
  const cv = getCv(lang);
  const t = getUi(lang);
  return (
    <footer className="border-t border-line pb-24 pt-8 text-[14px] text-muted xl:pb-8">
      <div className="wrap flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {cv.name}
          <span className="mx-2" aria-hidden="true">·</span>
          <span className="text-[13px]">{bidi(cv.footerNote, lang)}</span>
        </p>
        <a href="#main" className="link inline-flex min-h-11 items-center gap-1.5 text-ink">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19V5m0 0-6 6m6-6 6 6" /></svg>
          {t.footer.backToTop}
        </a>
      </div>
    </footer>
  );
}
