/**
 * Datenschicht fuer Bestenliste und Antwort-Analyse.
 *
 * Aktuell: Persistenz im localStorage des Browsers (Kiosk-Betrieb).
 * Spaeter: Soll auf ein geteiltes Backend umgestellt werden, muss nur dieses
 * Modul angepasst werden. Die oeffentliche Schnittstelle ist bewusst async
 * (Promises), damit ein spaeterer Netzwerk-Adapter ohne Aenderungen am
 * restlichen Code eingesetzt werden kann.
 *
 * Oeffentliche API:
 *   Storage.getLeaderboard()        -> Promise<Array<Entry>>  (sortiert, beste zuerst)
 *   Storage.saveScore(entry)        -> Promise<{ entry, rank }>
 *   Storage.getResponses()          -> Promise<Array<Response>>
 *   Storage.saveResponses(records)  -> Promise<void>
 *   Storage.clearAll()              -> Promise<void>
 *
 * Entry    = { id, name, niederlassung, score, correct, total, timeMs, date }
 * Response = { runId, qId, level, niederlassung, isCorrect, chosenText, correctText, date }
 */
const Storage = (() => {
  // v2: neue Wertung (1 Punkt je richtige Antwort) – startet mit frischen Daten.
  const LB_KEY = 'zwp_bim_quiz_leaderboard_v2';
  const RESP_KEY = 'zwp_bim_quiz_responses_v2';

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn(`Daten (${key}) konnten nicht gelesen werden:`, err);
      return [];
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Daten (${key}) konnten nicht gespeichert werden:`, err);
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
    return Promise.resolve(sortEntries(read(LB_KEY)));
  }

  function saveScore(entry) {
    const entries = read(LB_KEY);
    const stored = {
      id: (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)),
      name: String(entry.name || 'Anonym').slice(0, 40),
      niederlassung: String(entry.niederlassung || '—').slice(0, 40),
      score: Number(entry.score) || 0,
      correct: Number(entry.correct) || 0,
      total: Number(entry.total) || 0,
      timeMs: Number(entry.timeMs) || 0,
      date: entry.date || new Date().toISOString()
    };
    entries.push(stored);
    const sorted = sortEntries(entries);
    write(LB_KEY, sorted);
    const rank = sorted.findIndex((e) => e.id === stored.id) + 1;
    return Promise.resolve({ entry: stored, rank });
  }

  function getResponses() {
    return Promise.resolve(read(RESP_KEY));
  }

  function saveResponses(records) {
    if (!Array.isArray(records) || records.length === 0) return Promise.resolve();
    const all = read(RESP_KEY);
    all.push(...records);
    write(RESP_KEY, all);
    return Promise.resolve();
  }

  function clearAll() {
    write(LB_KEY, []);
    write(RESP_KEY, []);
    return Promise.resolve();
  }

  return { getLeaderboard, saveScore, getResponses, saveResponses, clearAll };
})();

if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
