import { inter, arabic } from "@/lib/fonts-en";
import { themeScript } from "@/lib/site";
import { getUi } from "@/data/ui";
import { withBase } from "@/lib/withBase";
import { fontStack } from "@/lib/fontStack";
import "./globals.css";

// GitHub Pages serves one 404.html for every language, so it speaks both.
export const metadata = {
  title: "404 | Yara Al-Mansouri",
  robots: { index: false },
};

export default function GlobalNotFound() {
  const en = getUi("en").notFound;
  const ar = getUi("ar").notFound;
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${inter.variable} ${arabic.variable}`}
      style={{ "--font-stack": fontStack(inter, arabic) }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <main id="main" className="grid min-h-svh place-items-center py-16">
          <div className="wrap grid gap-12 md:grid-cols-2">
            <section className="card p-8">
              <p className="eyebrow">404</p>
              <h1 className="h2 mt-3">{en.title}</h1>
              <p className="lead mt-3">{en.text}</p>
              <a href={withBase("/")} className="btn btn-primary mt-6">{en.home}</a>
            </section>
            <section lang="ar" dir="rtl" className="card p-8 text-[17px] leading-[1.8]">
              <p className="eyebrow">404</p>
              <h2 className="h2 mt-3">{ar.title}</h2>
              <p className="lead mt-3">{ar.text}</p>
              <a href={withBase("/ar/")} className="btn btn-primary mt-6">{ar.home}</a>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
