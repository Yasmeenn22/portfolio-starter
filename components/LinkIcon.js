import { socialIcons } from "@/lib/icons";
import BrandIcon from "@/components/BrandIcon";

// The real mark for each CV link; the portfolio link gets a plain globe.
export default function LinkIcon({ k, size = 18 }) {
  if (socialIcons[k]) return <BrandIcon icon={socialIcons[k]} size={k === "behance" ? size + 6 : size} />;
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  );
}
