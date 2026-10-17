// Auftakt-Karussell auf der Startseite: blendet die Mannschaftsfotos über.
// - Pfeile links und rechts im Foto, auf dem Handy auch Wischen.
// - Hält an, solange Maus oder Tastaturfokus im Karussell ist und wenn der Tab im Hintergrund liegt.
// - Wer selbst weiterschaltet (Pfeil, Wischen, I/II/III/F), übernimmt: der automatische Wechsel stoppt.
// - Bei "Bewegung reduzieren" startet nichts von selbst.
// - Die Fotos 2 bis n laden erst nach dem Seitenaufbau, damit das erste Foto schnell steht.
const INTERVAL = 4000;

const root = document.querySelector<HTMLElement>('[data-hero-carousel]');
const slides = root ? [...root.querySelectorAll<HTMLElement>('[data-hero-slide]')] : [];

if (root && slides.length > 1) {
  const photo = root.querySelector<HTMLElement>('.hero-photo');
  const captions = [...root.querySelectorAll<HTMLElement>('[data-hero-caption]')];
  const live = root.querySelector<HTMLElement>('[data-hero-captions]');
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-hero-dot]')];
  const steps = [...root.querySelectorAll<HTMLButtonElement>('[data-hero-step]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rtl = document.documentElement.dir === 'rtl';

  let current = 0;
  let stopped = reduced.matches; // vom Besucher übernommen (oder reduzierte Bewegung)
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

  // Der Besucher schaltet selbst: Wechsel stoppen, neue Mannschaft vorlesen
  const take = (i: number) => {
    loadImages();
    stopped = true;
    live?.setAttribute('aria-live', 'polite');
    show(i);
    schedule();
  };

  dots.forEach((d, n) => d.addEventListener('click', () => take(n)));
  steps.forEach((b) => b.addEventListener('click', () => take(current + Number(b.dataset.heroStep))));

  // Wischen auf dem Handy (horizontal, mindestens 40 px)
  let startX = 0;
  let startY = 0;
  photo?.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  photo?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    const forward = dx < 0 !== rtl;
    take(current + (forward ? 1 : -1));
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
    schedule();
  });

  // Bei reduzierter Bewegung erst laden, wenn jemand weiterschaltet
  if (!stopped) {
    if (document.readyState === 'complete') loadImages();
    else addEventListener('load', loadImages, { once: true });
  }
  root.querySelector('[data-hero-controls]')?.removeAttribute('hidden');
  steps.forEach((b) => (b.hidden = false));
  schedule();
}
