// Arabic pages: IBM Plex Sans Arabic for Arabic letters, Inter for the Latin words inside them.
// Weights 400, 600 and 700 (500 falls back to 400) keep the download small on phones.
// Not preloaded: with two root layouts Next shares one preload list, and it would load
// the Arabic files on the English pages too. The CSS still requests them at once.
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--font-arabic", display: "swap", preload: false });
