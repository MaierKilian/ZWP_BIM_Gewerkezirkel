/**
 * Quiz-Logik: Fragenauswahl, Mischen, Scoring inkl. Zeitbonus.
 *
 * Eine Quiz-Sitzung wird mit Quiz.create() erzeugt und kapselt den kompletten
 * Ablauf eines Durchlaufs (15 Fragen). Die UI (app.js) ruft nur die Methoden auf
 * und kuemmert sich nicht um die Auswahl-/Punktelogik.
 */
const Quiz = (() => {
  // Anzahl Fragen je Schwierigkeitsgrad pro Durchlauf (Summe = 15)
  const SELECTION = { easy: 3, medium: 6, hard: 6 };

  // Basispunkte je richtige Antwort nach Schwierigkeit
  const BASE_POINTS = { easy: 100, medium: 150, hard: 200 };

  // Zeitbonus: pro Frage gibt es bis zu MAX_TIME_BONUS Zusatzpunkte, die linear
  // von voller Hoehe (sofort geantwortet) auf 0 (nach BONUS_WINDOW_MS) sinken.
  // Greift nur bei richtiger Antwort. Bleibt klar unter den Basispunkten,
  // damit Wissen vor Schnelligkeit zaehlt.
  const MAX_TIME_BONUS = 50;
  const BONUS_WINDOW_MS = 20000; // 20 s

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(pool, n) {
    return shuffle(pool).slice(0, n);
  }

  /**
   * Baut die Fragenliste fuer einen Durchlauf:
   * - gewichtete Zufallsauswahl (3 leicht / 6 mittel / 6 schwer)
   * - Reihenfolge leicht -> mittel -> schwer
   * - Antwortoptionen je Frage gemischt (richtiger Index wird mitgefuehrt)
   */
  function buildQuestions(allQuestions) {
    const byLevel = { easy: [], medium: [], hard: [] };
    allQuestions.forEach((q) => {
      if (byLevel[q.level]) byLevel[q.level].push(q);
    });

    const selected = [
      ...pick(byLevel.easy, SELECTION.easy),
      ...pick(byLevel.medium, SELECTION.medium),
      ...pick(byLevel.hard, SELECTION.hard)
    ];

    return selected.map((q) => {
      const correctText = q.options[q.correct];
      const options = shuffle(q.options);
      return {
        id: q.id,
        level: q.level,
        q: q.q,
        options,
        correctIndex: options.indexOf(correctText),
        explanation: q.explanation
      };
    });
  }

  function timeBonus(answerMs) {
    if (answerMs >= BONUS_WINDOW_MS) return 0;
    const ratio = 1 - answerMs / BONUS_WINDOW_MS;
    return Math.round(MAX_TIME_BONUS * ratio);
  }

  function create(allQuestions) {
    const questions = buildQuestions(allQuestions);
    // answers[i] = { selectedIndex, answerMs }  (selectedIndex null = nicht beantwortet)
    const answers = new Array(questions.length).fill(null);
    let index = 0;

    function current() {
      return questions[index];
    }

    function answer(selectedIndex, answerMs) {
      answers[index] = { selectedIndex, answerMs: Math.max(0, answerMs || 0) };
    }

    function next() {
      if (index < questions.length - 1) {
        index += 1;
        return true;
      }
      return false;
    }

    function isLast() {
      return index === questions.length - 1;
    }

    /**
     * Wertet den gesamten Durchlauf aus.
     * Liefert Score, Anzahl richtig, Gesamtzeit und Detailliste fuer die Auswertung.
     */
    function result(totalTimeMs) {
      let score = 0;
      let correct = 0;
      const details = questions.map((q, i) => {
        const a = answers[i];
        const selectedIndex = a ? a.selectedIndex : null;
        const isCorrect = selectedIndex === q.correctIndex;
        if (isCorrect) {
          correct += 1;
          score += BASE_POINTS[q.level] + timeBonus(a.answerMs);
        }
        return {
          q: q.q,
          level: q.level,
          options: q.options,
          correctIndex: q.correctIndex,
          selectedIndex,
          isCorrect,
          explanation: q.explanation
        };
      });

      return {
        score,
        correct,
        total: questions.length,
        timeMs: totalTimeMs,
        details
      };
    }

    return {
      questions,
      current,
      answer,
      next,
      isLast,
      result,
      get index() { return index; },
      get total() { return questions.length; }
    };
  }

  return { create, SELECTION, BASE_POINTS, MAX_TIME_BONUS };
})();

if (typeof window !== 'undefined') {
  window.Quiz = Quiz;
}
