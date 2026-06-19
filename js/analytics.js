/**
 * Analyse-Auswertung des Quiz.
 *
 * Reine Berechnungsfunktionen (keine DOM-Zugriffe) auf Basis der gespeicherten
 * Einzelantworten (responses) und der Bestenliste (leaderboard). Die Aggregation
 * fuer die Diagramme passiert hier, das Rendering in app.js.
 */
const Analytics = (() => {

  function rate(part, total) {
    return total > 0 ? part / total : 0;
  }

  /**
   * Vergleich der Niederlassungen (immer ueber ALLE Daten, unabhaengig vom Filter).
   * Liefert je Niederlassung Teilnahmen, Antworten, Trefferquote und Schnitt-Score.
   */
  function byNiederlassung(responses, leaderboard) {
    const map = new Map();
    const ensure = (ndl) => {
      if (!map.has(ndl)) {
        map.set(ndl, { ndl, plays: 0, scoreSum: 0, answers: 0, correct: 0 });
      }
      return map.get(ndl);
    };

    leaderboard.forEach((e) => {
      const row = ensure(e.niederlassung || '—');
      row.plays += 1;
      row.scoreSum += Number(e.score) || 0;
    });
    responses.forEach((r) => {
      const row = ensure(r.niederlassung || '—');
      row.answers += 1;
      if (r.isCorrect) row.correct += 1;
    });

    return [...map.values()]
      .map((row) => ({
        ndl: row.ndl,
        plays: row.plays,
        answers: row.answers,
        correct: row.correct,
        correctRate: rate(row.correct, row.answers),
        avgScore: row.plays > 0 ? Math.round(row.scoreSum / row.plays) : 0
      }))
      .sort((a, b) => b.correctRate - a.correctRate || b.plays - a.plays);
  }

  /**
   * Niederlassungs-Ranking fuer den Wettbewerb:
   * sortiert nach Ø-Punkten je Teilnahme (Hauptkriterium), dann Trefferquote,
   * dann Anzahl Teilnahmen. Nur Niederlassungen mit mindestens einer Teilnahme.
   */
  function niederlassungRanking(responses, leaderboard) {
    return byNiederlassung(responses, leaderboard)
      .filter((row) => row.plays > 0)
      .sort((a, b) =>
        b.avgScore - a.avgScore ||
        b.correctRate - a.correctRate ||
        b.plays - a.plays
      );
  }

  /**
   * Auswertung je Frage fuer den gewaehlten Filter.
   * Nutzt den kanonischen Fragenkatalog (window.QUESTIONS) fuer Reihenfolge und
   * vollstaendige Antwortoptionen – auch fuer Optionen, die nie gewaehlt wurden.
   */
  /**
   * Liefert die "Antwortoptionen" einer Frage fuer die Verteilungs-Anzeige.
   * Nur Multiple-Choice und Wahr/Falsch lassen sich sinnvoll verteilen;
   * fuer Reihenfolge/Zuordnen gibt es keine Einzeloption -> leeres Array.
   */
  function optionsFor(q) {
    const type = q.type || 'mc';
    if (type === 'mc') {
      return q.options.map((text, i) => ({ text, isCorrect: i === q.correct }));
    }
    if (type === 'truefalse') {
      return [
        { text: 'Wahr', isCorrect: q.answer === true },
        { text: 'Falsch', isCorrect: q.answer === false }
      ];
    }
    return [];
  }

  function byQuestion(responses, questions) {
    return questions.map((q) => {
      const rows = responses.filter((r) => r.qId === q.id);
      const total = rows.length;
      const correct = rows.filter((r) => r.isCorrect).length;
      const unanswered = rows.filter((r) => r.answered === false).length;

      const options = optionsFor(q).map((o) => ({
        text: o.text,
        isCorrect: o.isCorrect,
        count: rows.filter((r) => r.chosenText === o.text).length
      }));

      return {
        qId: q.id,
        q: q.q,
        level: q.level,
        type: q.type || 'mc',
        total,
        correct,
        wrong: total - correct,
        unanswered,
        correctRate: rate(correct, total),
        options
      };
    });
  }

  /**
   * Trefferquote gruppiert nach einem Schluessel (z. B. Schwierigkeit oder Typ).
   * `order` legt die Ausgabereihenfolge fest; nur Gruppen mit Antworten erscheinen.
   */
  function groupRates(responses, keyFn, order) {
    const map = new Map();
    responses.forEach((r) => {
      const key = keyFn(r);
      if (!map.has(key)) map.set(key, { key, total: 0, correct: 0 });
      const g = map.get(key);
      g.total += 1;
      if (r.isCorrect) g.correct += 1;
    });
    const rows = [...map.values()].map((g) => ({
      key: g.key, total: g.total, correct: g.correct, correctRate: rate(g.correct, g.total)
    }));
    if (order) {
      rows.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    }
    return rows;
  }

  function median(nums) {
    if (nums.length === 0) return 0;
    const s = [...nums].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
  }

  /**
   * Komplette Auswertung. filterNdl = null/'' bedeutet "alle Niederlassungen".
   */
  function compute(responses, leaderboard, questions, filterNdl) {
    const filterResp = filterNdl
      ? responses.filter((r) => (r.niederlassung || '—') === filterNdl)
      : responses;
    const filterLb = filterNdl
      ? leaderboard.filter((e) => (e.niederlassung || '—') === filterNdl)
      : leaderboard;

    const totalAnswers = filterResp.length;
    const totalCorrect = filterResp.filter((r) => r.isCorrect).length;
    const scores = filterLb.map((e) => Number(e.score) || 0);
    const times = filterLb.map((e) => Number(e.timeMs) || 0).filter((t) => t > 0);
    const scoreSum = scores.reduce((s, v) => s + v, 0);
    const players = new Set(filterLb.map((e) => `${e.name}`.toLowerCase().trim())).size;

    return {
      filter: filterNdl || null,
      kpis: {
        plays: filterLb.length,
        players,
        answers: totalAnswers,
        correct: totalCorrect,
        correctRate: rate(totalCorrect, totalAnswers),
        avgScore: filterLb.length > 0 ? Math.round(scoreSum / filterLb.length) : 0,
        bestScore: scores.length ? Math.max(...scores) : 0,
        medianScore: median(scores),
        avgTimeMs: times.length ? Math.round(times.reduce((s, v) => s + v, 0) / times.length) : 0
      },
      byLevel: groupRates(filterResp, (r) => r.level, ['easy', 'medium', 'hard']),
      byType: groupRates(filterResp, (r) => r.type || 'mc', ['mc', 'truefalse', 'order', 'match']),
      byNiederlassung: byNiederlassung(responses, leaderboard),
      byQuestion: byQuestion(filterResp, questions)
    };
  }

  return { compute, byNiederlassung, byQuestion, niederlassungRanking, groupRates };
})();

if (typeof window !== 'undefined') {
  window.Analytics = Analytics;
}
