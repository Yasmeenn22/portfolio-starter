// "The Board": the 15 items from the CV (Languages 5, Leadership/teaching/volunteering 6,
// Interests 4) in story order, and where each one stands on the 8×8 board.
// Plain JavaScript (no imports) so scripts/check-cv.mjs can verify it too.

// Giving back follows the start dates in the CV: 2017, 2018, 2019, 2020, 2022, 2024.
export const GIVING_BACK_ORDER = [5, 4, 0, 3, 1, 2];

// [row, column]: row 0 is the top of the board, column 0 is the reading-start side
// (left in English, right in Arabic, because the grid follows the page direction).
// The story zigzags up the board from the start corner, one stop per item.
export const SQUARES = [
  [6, 0], [7, 2], [6, 4], [7, 6], [5, 7], // languages
  [4, 5], [5, 3], [4, 1], [3, 0], [2, 2], [3, 4], // giving back
  [2, 6], [1, 7], [0, 5], [1, 3], // interests
];
export const KNIGHT_HOME = [7, 0];

export function boardItems(cv, lang) {
  const comma = lang === "ar" ? "، " : ", ";
  const items = [
    ...cv.languages.map((l, i) => ({ id: `lang-${i}`, group: "languages", title: l.language, sub: null, text: [l.level, l.note].filter(Boolean).join(comma) })),
    ...GIVING_BACK_ORDER.map((i) => {
      const l = cv.leadership[i];
      return { id: `lead-${i}`, group: "leadership", title: l.role, sub: `${l.org} · ${l.period}`, text: l.detail };
    }),
    ...cv.interests.map((x, i) => ({ id: `interest-${i}`, group: "interests", title: x.line, sub: null, text: null })),
  ];
  return items.map((it, i) => ({ ...it, square: SQUARES[i] }));
}
