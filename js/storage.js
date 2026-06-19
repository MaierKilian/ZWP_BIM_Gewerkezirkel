/**
 * Datenschicht fuer die Bestenliste.
 *
 * Aktuell: Persistenz im localStorage des Browsers (Kiosk-Betrieb).
 * Spaeter: Soll auf ein geteiltes Backend umgestellt werden, muss nur dieses
 * Modul angepasst werden. Die oeffentliche Schnittstelle ist bewusst async
 * (Promises), damit ein spaeterer Netzwerk-Adapter ohne Aenderungen am
 * restlichen Code eingesetzt werden kann.
 *
 * Oeffentliche API:
 *   Storage.getLeaderboard()      -> Promise<Array<Entry>>  (sortiert, beste zuerst)
 *   Storage.saveScore(entry)      -> Promise<{ entry, rank }>
 *   Storage.clearLeaderboard()    -> Promise<void>
 *
 * Entry = { name, score, correct, total, timeMs, date }
 */
const Storage = (() => {
  const STORAGE_KEY = 'zwp_bim_quiz_leaderboard_v1';

  function readRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Bestenliste konnte nicht gelesen werden:', err);
      return [];
    }
  }

  function writeRaw(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.warn('Bestenliste konnte nicht gespeichert werden:', err);
    }
  }

  /**
   * Sortierung: hoechster Score zuerst; bei Gleichstand kuerzere Zeit zuerst.
   */
  function sortEntries(entries) {
    return [...entries].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeMs - b.timeMs;
    });
  }

  function getLeaderboard() {
    return Promise.resolve(sortEntries(readRaw()));
  }

  function saveScore(entry) {
    const entries = readRaw();
    const stored = {
      id: (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)),
      name: String(entry.name || 'Anonym').slice(0, 40),
      score: Number(entry.score) || 0,
      correct: Number(entry.correct) || 0,
      total: Number(entry.total) || 0,
      timeMs: Number(entry.timeMs) || 0,
      date: entry.date || new Date().toISOString()
    };
    entries.push(stored);
    const sorted = sortEntries(entries);
    writeRaw(sorted);
    const rank = sorted.findIndex((e) => e.id === stored.id) + 1;
    return Promise.resolve({ entry: stored, rank });
  }

  function clearLeaderboard() {
    writeRaw([]);
    return Promise.resolve();
  }

  return { getLeaderboard, saveScore, clearLeaderboard };
})();

if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
