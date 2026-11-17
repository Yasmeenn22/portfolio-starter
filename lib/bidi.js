// Arabic lines often hold Latin words: company and product names, tools, IDs, emails.
// bidi() wraps each Latin run (and numbers like "1,400+") in <bdi dir="ltr"> so it never
// scrambles inside a right-to-left line. In English it returns the text unchanged.
import { Fragment } from "react";

// A Latin run may contain ", " and a whole bracketed part "(CSAP)", never half a bracket.
// Numbers with a plus ("1,400+", "+19%") are isolated too, so the sign stays on the right side.
const RUN =
  /([A-Za-z@](?:[A-Za-z0-9@._\-+#/&:'’ ]*[A-Za-z0-9])?(?:(?:, ?| )?(?:\([A-Za-z0-9][A-Za-z0-9@._\-+#/&:'’ ]*\)|[A-Za-z0-9](?:[A-Za-z0-9@._\-+#/&:'’ ]*[A-Za-z0-9])?))*|\+?\d[\d,.]*%?\+|\+\d[\d,.]*%?)/g;

const ARABIC = /[؀-ۿ]/;

export function bidi(text, lang) {
  if (lang !== "ar" || typeof text !== "string" || !/[A-Za-z+]/.test(text)) return text;
  // No Arabic at all (a certificate name, an author list): one left-to-right piece.
  if (!ARABIC.test(text)) return <bdi dir="ltr">{text}</bdi>;
  const parts = text.split(RUN);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <bdi dir="ltr" key={i}>
        {part}
      </bdi>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

// Always left-to-right, in any language: phone numbers, emails, URLs, credential IDs.
export function Ltr({ children, className }) {
  return (
    <bdi dir="ltr" className={`break-any ${className || ""}`}>
      {children}
    </bdi>
  );
}
