// The CV in both languages. Components call getCv(lang) and never hard-code CV text.
import { cvEn } from "./cv.en.js";
import { cvAr } from "./cv.ar.js";

export { cvEn, cvAr };
export const cvs = { en: cvEn, ar: cvAr };
export function getCv(lang) {
  return lang === "ar" ? cvAr : cvEn;
}
// Kept for older imports: the English CV.
export const cv = cvEn;
