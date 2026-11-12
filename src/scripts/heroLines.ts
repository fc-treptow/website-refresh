// Leitsatz im Auftakt: rollt die Zeilen nacheinander durch wie eine Anzeigetafel.
// - Nach der letzten Zeile eine kurze Pause ohne Text, dann beginnt die Folge von vorn.
// - Hält an wie das Fotokarussell: solange Maus oder Tastaturfokus im Auftakt sind und wenn der
//   Tab im Hintergrund liegt. Schaltet der Besucher die Fotos selbst weiter, bleibt der Leitsatz
//   auf der aktuellen Zeile stehen (WCAG 2.2.2: Bewegung lässt sich anhalten).
// - Bei "Bewegung reduzieren" bleibt die erste Zeile stehen, wie ohne JavaScript.
export {};

const STEP = 2400; // Standzeit je Zeile
const LAST = 4000; // die letzte Zeile steht länger
const GAP = 700; // Pause ohne Text vor dem Neustart
const LEAVE = 500; // Dauer des Wegrollens (passend zu global.css)

const root = document.querySelector<HTMLElement>('[data-hero-lines]');
const lines = root ? [...root.querySelectorAll<HTMLElement>('.hero-line')] : [];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (lines.length > 1 && !reduced) {
  const area = root!.closest<HTMLElement>('[data-hero-carousel]') ?? root!;
  let current = 0; // -1 = Pause ohne Text
  let timer: number | undefined;
  let held = false;
  let stopped = false;

  const leave = (el: HTMLElement) => {
    el.dataset.state = 'leaving';
    window.setTimeout(() => {
      if (el.dataset.state === 'leaving') delete el.dataset.state;
    }, LEAVE);
  };

  const delay = () => (current === -1 ? GAP : current === lines.length - 1 ? LAST : STEP);

  const step = () => {
    if (current === -1) {
      current = 0;
    } else {
      leave(lines[current]);
      current = current === lines.length - 1 ? -1 : current + 1;
    }
    if (current !== -1) lines[current].dataset.state = 'active';
    schedule();
  };

  const schedule = () => {
    clearTimeout(timer);
    if (!stopped && !held && !document.hidden) timer = window.setTimeout(step, delay());
  };

  const hold = (on: boolean) => {
    held = on;
    schedule();
  };

  // Steht der Leitsatz beim Anhalten gerade in der Pause, die erste Zeile zeigen
  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    if (current === -1) {
      current = 0;
      lines[0].dataset.state = 'active';
    }
  };

  area.addEventListener('mouseenter', () => hold(true));
  area.addEventListener('mouseleave', () => hold(false));
  area.addEventListener('focusin', () => hold(true));
  area.addEventListener('focusout', (e) => {
    if (!area.contains(e.relatedTarget as Node | null)) hold(false);
  });
  document.addEventListener('visibilitychange', schedule);
  area.querySelectorAll('[data-hero-step], [data-hero-dot]').forEach((b) => b.addEventListener('click', stop));
  area.querySelector('.hero-photo')?.addEventListener('touchend', () => {
    // Wischen schaltet die Fotos selbst weiter (heroCarousel.ts), dann auch hier anhalten
    window.setTimeout(() => {
      if (area.querySelector('[data-hero-captions]')?.getAttribute('aria-live') === 'polite') stop();
    }, 0);
  });

  schedule();
}
