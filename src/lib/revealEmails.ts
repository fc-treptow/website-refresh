import { decodeEmail } from './email';

// Macht aus jedem Element mit data-email einen mailto-Link und setzt die Adresse in alle
// [data-email-text] darin (oder in das Element selbst, wenn es data-email-text trägt).
// Wird einmal im Basis-Layout geladen und gilt damit für jede Seite.
function reveal() {
  document.querySelectorAll<HTMLElement>('[data-email]').forEach((el) => {
    let address: string;
    try {
      address = decodeEmail(el.dataset.email ?? '');
    } catch {
      return;
    }
    const subject = el.dataset.emailSubject;
    if (el instanceof HTMLAnchorElement) {
      el.href = `mailto:${address}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
    }
    const targets = el.hasAttribute('data-email-text') ? [el] : el.querySelectorAll<HTMLElement>('[data-email-text]');
    targets.forEach((t) => (t.textContent = address));
  });
}

reveal();
