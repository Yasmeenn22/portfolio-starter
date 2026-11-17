// The one calligraphic face on the site (Aref Ruqaa, a Ruqʿah hand), a nod to her Arabic calligraphy.
// Used only for the decorative copy of her Arabic name in the hero and the sign-off in Contact,
// both aria-hidden next to the real text. One weight, Arabic letters only, font-display: swap,
// never preloaded. It is exposed as --font-calli and only switched on (html.calli-ready) by
// components/CalliLoader.js after the page has loaded, so it never competes with the page's own
// text and images; until then the pen waits, and without JavaScript the name shows in Plex Arabic.
import { Aref_Ruqaa } from "next/font/google";

export const calli = Aref_Ruqaa({ subsets: ["arabic"], weight: "700", display: "swap", preload: false, fallback: ["serif"], variable: "--font-calli" });
