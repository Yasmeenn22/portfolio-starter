// Links to an entry that may be hidden (a collapsed role, another tab, a filtered list,
// the game's list view) call openTarget(id): the owning component shows it, then we scroll.
export const REVEAL_EVENT = "reveal-target";

export function openTarget(id, event) {
  const el = typeof document !== "undefined" && document.getElementById(id);
  event?.preventDefault?.();
  window.dispatchEvent(new CustomEvent(REVEAL_EVENT, { detail: id }));
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const target = document.getElementById(id) || el;
      if (!target) return;
      target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
      target.focus?.({ preventScroll: true });
    }),
  );
}

// Subscribe a component to reveal requests (and to the hash the page was opened with).
export function onReveal(handler) {
  const fromEvent = (e) => handler(e.detail);
  const fromHash = () => location.hash && handler(decodeURIComponent(location.hash.slice(1)));
  window.addEventListener(REVEAL_EVENT, fromEvent);
  window.addEventListener("hashchange", fromHash);
  fromHash();
  return () => {
    window.removeEventListener(REVEAL_EVENT, fromEvent);
    window.removeEventListener("hashchange", fromHash);
  };
}
