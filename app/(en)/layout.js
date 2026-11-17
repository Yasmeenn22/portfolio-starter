import { inter, arabic } from "@/lib/fonts-en";
import { buildMetadata, themeScript, viewport as siteViewport } from "@/lib/site";
import SiteShell from "@/components/SiteShell";
import { fontStack } from "@/lib/fontStack";
import "../globals.css";

// English root layout: the exported HTML carries lang="en" dir="ltr".
export const metadata = buildMetadata("en");
export const viewport = siteViewport;

export default function EnglishLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${inter.variable} ${arabic.variable}`}
      style={{ "--font-stack": fontStack(inter, arabic) }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteShell lang="en">{children}</SiteShell>
      </body>
    </html>
  );
}
