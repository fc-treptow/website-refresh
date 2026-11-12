// Leitsatz im Auftakt: rollt die Zeilen einmal nacheinander durch und bleibt auf der letzten stehen.
// - Läuft nur einmal und ist nach gut fünf Sekunden fertig, braucht also keinen Pause-Knopf (WCAG 2.2.2).
// - Bei "Bewegung reduzieren" bleibt die erste Zeile stehen, wie ohne JavaScript.
// - Liegt der Tab im Hintergrund, startet die Folge erst, wenn er sichtbar wird.
export {}; // eigenes Modul, damit sich die Namen nicht mit heroCarousel.ts überschneiden

const STEP = 2400;
const LEAVE = 500;

const root = document.querySelector<HTMLElement>('[data-hero-lines]');
const lines = root ? [...root.querySelectorAll<HTMLElement>('.hero-line')] : [];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (lines.length > 1 && !reduced) {
  let current = 0;

  const advance = () => {
    const prev = lines[current];
    current += 1;
    prev.dataset.state = 'leaving';
    lines[current].dataset.state = 'active';
    window.setTimeout(() => {
      if (prev.dataset.state === 'leaving') delete prev.dataset.state;
    }, LEAVE);
    if (current < lines.length - 1) window.setTimeout(advance, STEP);
  };

  const start = () => window.setTimeout(advance, STEP);

  if (document.hidden) {
    document.addEventListener('visibilitychange', function onVisible() {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onVisible);
      start();
    });
  } else {
    start();
  }
}
