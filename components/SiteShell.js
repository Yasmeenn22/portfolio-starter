import { getCv } from "@/data/cv";
import { getUi } from "@/data/ui";
import { cvHref } from "@/lib/paths";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/ProgressBar";
import MotionRoot from "@/components/MotionRoot";
import Dalil from "@/components/Dalil";
import CalliLoader from "@/components/CalliLoader";

// Everything around the page content, shared by the English and Arabic layouts.
// Layers, bottom to top: content, Dalil (40), header (50), menu (55), progress bar (60), dialogs (top layer).
export default function SiteShell({ lang, children }) {
  const cv = getCv(lang);
  const t = getUi(lang);
  return (
    <>
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <ProgressBar />
      <Header lang={lang} name={cv.shortName} cvHref={cvHref(cv)} />
      {children}
      <Footer lang={lang} />
      <Dalil lang={lang} cvHref={cvHref(cv)} />
      <MotionRoot />
      <CalliLoader />
    </>
  );
}
