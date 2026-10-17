// Auftakt-Karussell auf der Startseite: blendet die Mannschaftsfotos langsam über.
// - Hält an, solange Maus oder Tastaturfokus im Karussell ist und wenn der Tab im Hintergrund liegt.
// - Pause-Knopf (WCAG 2.2.2). Wer eine Mannschaft anwählt, übernimmt: der Wechsel stoppt.
// - Bei "Bewegung reduzieren" startet nichts von selbst.
// - Die Fotos 2 bis n laden erst nach dem Seitenaufbau, damit das erste Foto schnell steht.
const INTERVAL = 6500;

const root = document.querySelector<HTMLElement>('[data-hero-carousel]');
const slides = root ? [...root.querySelectorAll<HTMLElement>('[data-hero-slide]')] : [];

if (root && slides.length > 1) {
  const captions = [...root.querySelectorAll<HTMLElement>('[data-hero-caption]')];
  const live = root.querySelector<HTMLElement>('[data-hero-captions]');
  const controls = root.querySelector<HTMLElement>('[data-hero-controls]');
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-hero-dot]')];
  const toggle = root.querySelector<HTMLButtonElement>('[data-hero-toggle]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let current = 0;
  let stopped = reduced.matches; // vom Besucher angehalten (oder reduzierte Bewegung)
  let held = false; // vorübergehend angehalten (Maus, Fokus, Tab im Hintergrund)
  let timer: number | undefined;

  const loadImages = () =>
    slides.forEach((s) => {
      const img = s.querySelector('img');
      if (!img?.dataset.src) return;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      delete img.dataset.src;
      delete img.dataset.srcset;
    });

  const show = (i: number) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, n) => {
      const on = n === current;
      s.dataset.active = String(on);
      s.inert = !on;
    });
    captions.forEach((c, n) => (c.hidden = n !== current));
    dots.forEach((d, n) => d.setAttribute('aria-current', String(n === current)));
  };

  const schedule = () => {
    clearTimeout(timer);
    if (!stopped && !held) timer = window.setTimeout(() => (show(current + 1), schedule()), INTERVAL);
  };

  const render = () => {
    if (toggle) {
      toggle.setAttribute('aria-label', (stopped ? toggle.dataset.labelPlay : toggle.dataset.labelPause) ?? '');
      toggle.querySelector<HTMLElement>('[data-icon-pause]')!.hidden = stopped;
      toggle.querySelector<HTMLElement>('[data-icon-play]')!.hidden = !stopped;
    }
    // Läuft der Wechsel, nicht jede Mannschaft vorlesen; angehalten schon.
    live?.setAttribute('aria-live', stopped ? 'polite' : 'off');
    schedule();
  };

  dots.forEach((d, n) =>
    d.addEventListener('click', () => {
      loadImages();
      stopped = true;
      show(n);
      render();
    }),
  );
  toggle?.addEventListener('click', () => {
    loadImages();
    stopped = !stopped;
    if (!stopped) show(current + 1);
    render();
  });

  const hold = (on: boolean) => {
    held = on;
    schedule();
  };
  root.addEventListener('mouseenter', () => hold(true));
  root.addEventListener('mouseleave', () => hold(root.contains(document.activeElement)));
  root.addEventListener('focusin', () => hold(true));
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget as Node | null)) hold(root.matches(':hover'));
  });
  document.addEventListener('visibilitychange', () => hold(document.hidden));
  reduced.addEventListener('change', () => {
    stopped = reduced.matches;
    render();
  });

  // Bei reduzierter Bewegung erst laden, wenn jemand weiterschaltet
  if (!stopped) {
    if (document.readyState === 'complete') loadImages();
    else addEventListener('load', loadImages, { once: true });
  }
  controls?.removeAttribute('hidden');
  render();
}
