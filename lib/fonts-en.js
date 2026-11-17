// English pages: Inter (the CV's own typeface). The Arabic face is only needed for the
// "العربية" switch label, so one weight, never preloaded.
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["600"], variable: "--font-arabic", display: "swap", preload: false });
