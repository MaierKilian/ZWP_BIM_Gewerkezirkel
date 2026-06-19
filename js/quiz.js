/**
 * Quiz-Logik: Fragenauswahl, Mischen, mehrere Fragetypen, Scoring inkl. Zeitbonus.
 *
 * Unterstuetzte Fragetypen (Feld `type`, Default 'mc'):
 *   'mc'        Multiple Choice          (options[], correct: Index)
 *   'truefalse' Wahr/Falsch              (answer: Boolean)
 *   'order'     Reihenfolge bringen      (items[] in richtiger Reihenfolge)
 *   'match'     Zuordnen / Verbinden     (pairs[] = [{ left, right }])
 *
 * Eine Quiz-Sitzung wird mit Quiz.create() erzeugt. Die UI (app.js) liest pro
 * Frage das vorbereitete Laufzeit-Objekt (current()) und meldet die Antwort
 * ueber answer() zurueck; Auswahl, Scoring und Bewertung passieren hier.
 */
const Quiz = (() => {
  const SELECTION = { easy: 3, medium: 6, hard: 6 };       // Summe = 15
  const BASE_POINTS = { easy: 100, medium: 150, hard: 200 };
  const MAX_TIME_BONUS = 50;
  const BONUS_WINDOW_MS = 20000; // 20 s
  const MIN_INTERACTIVE = 3;     // mind. so viele Nicht-MC-Fragen pro Durchlauf (falls vorhanden)

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pick(pool, n) { return shuffle(pool).slice(0, n); }
  function arraysEqual(a, b) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
  }
  function typeOf(q) { return q.type || 'mc'; }

  /**
   * Gewichtete Zufallsauswahl (3 leicht / 6 mittel / 6 schwer) mit Garantie,
   * dass moeglichst mindestens MIN_INTERACTIVE interaktive (Nicht-MC) Fragen
   * enthalten sind. Reihenfolge: leicht -> mittel -> schwer.
   */
  function selectQuestions(all) {
    const byLevel = { easy: [], medium: [], hard: [] };
    all.forEach((q) => { if (byLevel[q.level]) byLevel[q.level].push(q); });

    const selected = [
      ...pick(byLevel.easy, SELECTION.easy),
      ...pick(byLevel.medium, SELECTION.medium),
      ...pick(byLevel.hard, SELECTION.hard)
    ];

    const isInteractive = (q) => typeOf(q) !== 'mc';
    let have = selected.filter(isInteractive).length;
    if (have < MIN_INTERACTIVE) {
      const ids = new Set(selected.map((q) => q.id));
      const spares = shuffle(all.filter((q) => isInteractive(q) && !ids.has(q.id)));
      for (const cand of spares) {
        if (have >= MIN_INTERACTIVE) break;
        // bevorzugt eine MC-Frage gleicher Schwierigkeit ersetzen
        let idx = selected.findIndex((q) => !isInteractive(q) && q.level === cand.level);
        if (idx === -1) idx = selected.findIndex((q) => !isInteractive(q));
        if (idx === -1) break;
        selected[idx] = cand;
        have += 1;
      }
    }
    return selected;
  }

  /**
   * Baut aus einer Quellfrage das Laufzeit-Objekt (gemischte Optionen/Items).
   */
  function prepare(q) {
    const type = typeOf(q);
    const base = { id: q.id, level: q.level, type, q: q.q, explanation: q.explanation };

    if (type === 'mc') {
      const correctText = q.options[q.correct];
      const options = shuffle(q.options);
      return { ...base, options, correctIndex: options.indexOf(correctText) };
    }
    if (type === 'truefalse') {
      return { ...base, answer: q.answer === true };
    }
    if (type === 'order') {
      const correct = q.items.slice();
      let start = shuffle(q.items);
      // Nicht zufaellig schon richtig starten lassen
      if (arraysEqual(start, correct) && correct.length > 1) start = shuffle(q.items);
      return { ...base, prompt: q.prompt || 'Bring die Elemente in die richtige Reihenfolge (oben = zuerst).', correct, start };
    }
    if (type === 'match') {
      const lefts = q.pairs.map((p) => p.left);
      const correct = q.pairs.map((p) => p.right);     // ausgerichtet an lefts
      const rights = shuffle(q.pairs.map((p) => p.right));
      return { ...base, prompt: q.prompt || 'Ordne jedem Begriff das Passende zu.', lefts, rights, correct };
    }
    return base;
  }

  /** Bewertung (alles-oder-nichts je Frage). */
  function grade(rt, value) {
    switch (rt.type) {
      case 'mc':        return value === rt.correctIndex;
      case 'truefalse': return value === rt.answer;
      case 'order':     return arraysEqual(value, rt.correct);
      case 'match':     return Array.isArray(value) && rt.correct.every((r, i) => value[i] === r);
      default:          return false;
    }
  }

  /** Felder fuer die Antwort-Analyse (nur fuer mc/truefalse sinnvoll auswertbar). */
  function analyticsFields(rt, value) {
    if (rt.type === 'mc') {
      return {
        chosenText: (value != null) ? rt.options[value] : null,
        correctText: rt.options[rt.correctIndex]
      };
    }
    if (rt.type === 'truefalse') {
      return {
        chosenText: value === true ? 'Wahr' : value === false ? 'Falsch' : null,
        correctText: rt.answer ? 'Wahr' : 'Falsch'
      };
    }
    return { chosenText: null, correctText: null };
  }

  function timeBonus(answerMs) {
    if (answerMs >= BONUS_WINDOW_MS) return 0;
    return Math.round(MAX_TIME_BONUS * (1 - answerMs / BONUS_WINDOW_MS));
  }

  function create(allQuestions) {
    const questions = selectQuestions(allQuestions).map(prepare);
    const answers = new Array(questions.length).fill(null); // { value, answerMs }
    let index = 0;

    function current() { return questions[index]; }
    function answer(value, answerMs) {
      answers[index] = { value, answerMs: Math.max(0, answerMs || 0) };
    }
    function next() {
      if (index < questions.length - 1) { index += 1; return true; }
      return false;
    }
    function isLast() { return index === questions.length - 1; }

    function result(totalTimeMs) {
      let score = 0;
      let correct = 0;
      const details = questions.map((rt, i) => {
        const a = answers[i];
        const value = a ? a.value : null;
        const answered = value !== null && value !== undefined;
        const isCorrect = answered ? grade(rt, value) : false;
        if (isCorrect) {
          correct += 1;
          score += BASE_POINTS[rt.level] + timeBonus(a.answerMs);
        }
        return {
          id: rt.id,
          type: rt.type,
          level: rt.level,
          q: rt.q,
          explanation: rt.explanation,
          rt,
          value,
          answered,
          isCorrect,
          ...analyticsFields(rt, value)
        };
      });
      return { score, correct, total: questions.length, timeMs: totalTimeMs, details };
    }

    return {
      questions, current, answer, next, isLast, result,
      get index() { return index; },
      get total() { return questions.length; }
    };
  }

  return { create, grade, SELECTION, BASE_POINTS, MAX_TIME_BONUS };
})();

if (typeof window !== 'undefined') {
  window.Quiz = Quiz;
}
