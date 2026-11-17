import Image from "next/image";
import { inkIcons } from "@/lib/icons";

// A real brand mark. Black marks flip to light in dark mode so they stay visible.
export default function BrandIcon({ icon, size = 20, alt = "", className = "" }) {
  if (!icon) return null;
  const ratio = icon.width / icon.height;
  const w = ratio >= 1 ? size : Math.round(size * ratio);
  const h = ratio >= 1 ? Math.round(size / ratio) : size;
  return (
    <Image
      src={icon}
      alt={alt}
      width={w}
      height={h}
      className={`${inkIcons.has(icon) ? "dark:invert" : ""} shrink-0 ${className}`}
    />
  );
}
