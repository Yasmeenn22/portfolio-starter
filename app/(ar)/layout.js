import { inter, arabic } from "@/lib/fonts-ar";
import { buildMetadata, themeScript, viewport as siteViewport } from "@/lib/site";
import SiteShell from "@/components/SiteShell";
import { fontStack } from "@/lib/fontStack";
import "../globals.css";

// Arabic root layout: the exported HTML carries lang="ar" dir="rtl".
export const metadata = buildMetadata("ar");
export const viewport = siteViewport;

export default function ArabicLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${inter.variable} ${arabic.variable}`}
      style={{ "--font-stack": fontStack(inter, arabic) }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteShell lang="ar">{children}</SiteShell>
      </body>
    </html>
  );
}
