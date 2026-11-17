// A CV number that rolls up like an odometer each time it enters the screen (components/MotionRoot.js
// marks it data-in; the motion is CSS). Each digit is a column of 0–9 twice over that rolls to its
// place, the right-hand columns turning a little longer. Everything around the digits ("+", ",",
// " million+") stays still. The digits are drawn by CSS (no extra text in the page), and the exact
// CV text ("40+", "9 million+", "1,400+") is the real text that screen readers and search engines get.
// Without JavaScript or with reduced motion, the columns simply rest on the final digits.
export default function CountUp({ value, className = "" }) {
  const m = value.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!m) {
    return (
      <span className="flex flex-col items-start gap-2">
        <span dir="ltr" className={`inline-block tabular-nums ${className}`}>
          {value}
        </span>
      </span>
    );
  }
  const [, pre, digits, post] = m;
  const chars = [...digits];
  let col = 0;
  return (
    <span className="flex flex-col items-start gap-2" data-stage="">
      <span dir="ltr" className={`odo tabular-nums ${className}`}>
        <span className="sr-only">{value}</span>
        <span aria-hidden="true" className="odo-face">
          {pre ? <span className="odo-text">{pre}</span> : null}
          {chars.map((ch, i) => {
            if (!/\d/.test(ch)) {
              return (
                <span key={i} className="odo-text">
                  {ch}
                </span>
              );
            }
            const c = col++;
            return (
              <span key={i} className="odo-col">
                {/* 10 + digit: one full turn, then the digit; columns further right turn longer */}
                <span className="odo-strip" style={{ "--p": 10 + Number(ch), "--c": c }} />
              </span>
            );
          })}
          {post ? <span className="odo-text">{post}</span> : null}
        </span>
      </span>
      <span aria-hidden="true" className="count-bar" />
    </span>
  );
}
