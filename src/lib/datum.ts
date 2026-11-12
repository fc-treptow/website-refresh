// Heutiges Datum in Berlin als "YYYY-MM-DD", für Ab-/Bis-Angaben aus dem CMS
export const heuteBerlin = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

// true, wenn "bis einschließlich" schon vorbei ist. Ohne Datum nie abgelaufen.
export const istAbgelaufen = (bis: Date | null | undefined) => !!bis && heuteBerlin() > bis.toISOString().slice(0, 10);
