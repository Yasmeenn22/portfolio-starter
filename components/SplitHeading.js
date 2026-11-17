// A heading whose text rises in piece by piece when it enters the screen.
// English splits per character; Arabic per word (splitting Arabic letters breaks the joined script).
// Screen readers get the full text from aria-label; the pieces are aria-hidden.
export default function SplitHeading({ as: Tag = "h2", text, lang, className = "", id }) {
  const words = text.split(" ");
  let i = 0;
  return (
    <Tag id={id} className={className} aria-label={text} data-split="">
      <span aria-hidden="true">
        {words.map((word, w) => (
          <span key={w}>
            {lang === "ar" ? (
              <span className="split-piece" style={{ "--i": i++ }}>
                {word}
              </span>
            ) : (
              <span className="split-word">
                {[...word].map((ch, c) => (
                  <span key={c} className="split-piece" style={{ "--i": i++ }}>
                    {ch}
                  </span>
                ))}
              </span>
            )}
            {w < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </Tag>
  );
}
