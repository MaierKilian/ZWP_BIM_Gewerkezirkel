/**
 * App-Steuerung: Screen-Wechsel, Quiz-Ablauf, Bestenliste und Auswertung.
 * Bindet config.js, questions.js, storage.js, quiz.js und analytics.js zusammen.
 */
(() => {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const LEVEL_LABEL = { easy: 'leicht', medium: 'mittel', hard: 'schwer' };

  // ---- DOM-Referenzen ----
  const screens = {
    start:       document.getElementById('screen-start'),
    quiz:        document.getElementById('screen-quiz'),
    result:      document.getElementById('screen-result'),
    leaderboard: document.getElementById('screen-leaderboard'),
    analysis:    document.getElementById('screen-analysis')
  };

  const el = {
    startForm:        document.getElementById('start-form'),
    nameInput:        document.getElementById('player-name'),
    nameError:        document.getElementById('name-error'),
    ndlSelect:        document.getElementById('player-ndl'),
    ndlError:         document.getElementById('ndl-error'),
    showLbStart:      document.getElementById('show-leaderboard-start'),
    showAnalysisStart:document.getElementById('show-analysis-start'),

    qCounter:         document.getElementById('q-counter'),
    qLevel:           document.getElementById('q-level'),
    qTimer:           document.getElementById('q-timer'),
    progressFill:     document.getElementById('progressbar-fill'),
    qText:            document.getElementById('q-text'),
    qOptions:         document.getElementById('q-options'),
    btnNext:          document.getElementById('btn-next'),

    resultName:       document.getElementById('result-name'),
    resultRankBadge:  document.getElementById('result-rank-badge'),
    resultScore:      document.getElementById('result-score'),
    resultCorrect:    document.getElementById('result-correct'),
    resultTime:       document.getElementById('result-time'),
    resultNdlRank:    document.getElementById('result-ndl-rank'),
    btnShowLb:        document.getElementById('btn-show-leaderboard'),
    btnToggleReview:  document.getElementById('btn-toggle-review'),
    btnRestartResult: document.getElementById('btn-restart-result'),
    review:           document.getElementById('review'),

    lbList:           document.getElementById('leaderboard-list'),
    lbEmpty:          document.getElementById('leaderboard-empty'),
    lbMode:           document.getElementById('lb-mode'),
    ndlRanking:       document.getElementById('ndl-ranking'),
    ndlRankingHint:   document.getElementById('ndl-ranking-hint'),
    btnPlayAgain:     document.getElementById('btn-play-again'),
    btnShowAnalysis:  document.getElementById('btn-show-analysis'),
    btnClear:         document.getElementById('btn-clear'),

    ndlFilter:        document.getElementById('ndl-filter'),
    analysisEmpty:    document.getElementById('analysis-empty'),
    analysisContent:  document.getElementById('analysis-content'),
    kpiGrid:          document.getElementById('kpi-grid'),
    blockNdl:         document.getElementById('block-ndl'),
    chartNdl:         document.getElementById('chart-ndl'),
    chartQuestions:   document.getElementById('chart-questions'),
    qSort:            document.getElementById('q-sort'),
    btnAnalysisBack:  document.getElementById('btn-analysis-back'),
    btnAnalysisPlay:  document.getElementById('btn-analysis-play')
  };

  // ---- Sitzungszustand ----
  const state = {
    playerName: '',
    playerNdl: '',
    runId: null,
    session: null,
    quizStart: 0,
    questionStart: 0,
    selectedIndex: null,
    lastResult: null,
    lastRank: null,
    lastEntryId: null,
    timerId: null,
    analysisFilter: '',
    analysisSort: 'hardest',
    lbMode: 'players'
  };

  // ---- Helfer ----
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('is-active'));
    screens[name].classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function pct(rate) { return `${Math.round(rate * 100)}%`; }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---- Auswahllisten befuellen ----
  function populateNiederlassungen() {
    const list = window.NIEDERLASSUNGEN || [];
    list.forEach((ndl) => {
      const opt = document.createElement('option');
      opt.value = ndl; opt.textContent = ndl;
      el.ndlSelect.appendChild(opt);

      const fOpt = document.createElement('option');
      fOpt.value = ndl; fOpt.textContent = ndl;
      el.ndlFilter.appendChild(fOpt);
    });
  }

  // ---- Timer ----
  function startTimer() {
    stopTimer();
    state.timerId = setInterval(() => {
      el.qTimer.textContent = formatTime(Date.now() - state.quizStart);
    }, 250);
  }
  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  // ---- Quizstart ----
  function startQuiz(name, ndl) {
    state.playerName = name;
    state.playerNdl = ndl;
    state.runId = uid();
    state.session = Quiz.create(window.QUESTIONS);
    state.quizStart = Date.now();
    el.qTimer.textContent = '00:00';
    showScreen('quiz');
    startTimer();
    renderQuestion();
  }

  function renderQuestion() {
    const session = state.session;
    const q = session.current();
    state.selectedIndex = null;
    state.questionStart = Date.now();

    el.qCounter.textContent = `Frage ${session.index + 1} / ${session.total}`;
    el.qLevel.textContent = LEVEL_LABEL[q.level];
    el.qLevel.dataset.level = q.level;
    el.qText.textContent = q.q;

    el.progressFill.style.width = `${(session.index / session.total) * 100}%`;

    el.qOptions.innerHTML = '';
    q.options.forEach((text, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.innerHTML = `<span class="option__key">${LETTERS[i]}</span><span class="option__text"></span>`;
      btn.querySelector('.option__text').textContent = text;
      btn.addEventListener('click', () => selectOption(i, btn));
      el.qOptions.appendChild(btn);
    });

    el.btnNext.disabled = true;
    el.btnNext.textContent = session.isLast() ? 'Auswerten' : 'Weiter';
  }

  function selectOption(i, btn) {
    state.selectedIndex = i;
    el.qOptions.querySelectorAll('.option').forEach((o) => o.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    el.btnNext.disabled = false;
  }

  function handleNext() {
    if (state.selectedIndex === null) return;
    const session = state.session;
    session.answer(state.selectedIndex, Date.now() - state.questionStart);

    if (session.isLast()) {
      finishQuiz();
    } else {
      session.next();
      renderQuestion();
    }
  }

  // ---- Quizende ----
  function buildResponseRecords(details) {
    const date = new Date().toISOString();
    return details.map((d) => ({
      runId: state.runId,
      qId: d.id,
      level: d.level,
      niederlassung: state.playerNdl,
      isCorrect: d.isCorrect,
      chosenText: d.selectedIndex !== null ? d.options[d.selectedIndex] : null,
      correctText: d.options[d.correctIndex],
      date
    }));
  }

  function finishQuiz() {
    stopTimer();
    el.progressFill.style.width = '100%';
    const totalTime = Date.now() - state.quizStart;
    const result = state.session.result(totalTime);
    state.lastResult = result;

    Promise.all([
      Storage.saveScore({
        name: state.playerName,
        niederlassung: state.playerNdl,
        score: result.score,
        correct: result.correct,
        total: result.total,
        timeMs: result.timeMs
      }),
      Storage.saveResponses(buildResponseRecords(result.details))
    ]).then(([{ entry, rank }]) => {
      state.lastRank = rank;
      state.lastEntryId = entry.id;
      renderResult();
      showScreen('result');
    });
  }

  function renderResult() {
    const r = state.lastResult;
    el.resultName.textContent = state.playerName;
    el.resultRankBadge.textContent = `Platz ${state.lastRank}. · ${state.playerNdl}`;
    el.resultScore.textContent = r.score.toLocaleString('de-DE');
    el.resultCorrect.textContent = `${r.correct} / ${r.total}`;
    el.resultTime.textContent = formatTime(r.timeMs);

    el.review.hidden = true;
    el.btnToggleReview.textContent = 'Auflösung anzeigen';
    renderReview(r.details);
    renderResultNdlRank();
  }

  function renderResultNdlRank() {
    el.resultNdlRank.hidden = true;
    Promise.all([Storage.getResponses(), Storage.getLeaderboard()])
      .then(([responses, leaderboard]) => {
        const ranking = Analytics.niederlassungRanking(responses, leaderboard);
        const idx = ranking.findIndex((row) => row.ndl === state.playerNdl);
        if (idx === -1 || ranking.length === 0) return;
        const row = ranking[idx];
        el.resultNdlRank.innerHTML =
          `🏢 Niederlassung <strong></strong>: aktuell Platz ${idx + 1} von ${ranking.length} ` +
          `<span class="muted">(Ø ${row.avgScore.toLocaleString('de-DE')} P · ${pct(row.correctRate)} richtig)</span>`;
        el.resultNdlRank.querySelector('strong').textContent = row.ndl;
        el.resultNdlRank.hidden = false;
      });
  }

  function renderReview(details) {
    el.review.innerHTML = '';
    details.forEach((d, idx) => {
      const item = document.createElement('div');
      item.className = `review-item ${d.isCorrect ? 'is-correct' : 'is-wrong'}`;

      const answers = d.options.map((text, i) => {
        const isCorrect = i === d.correctIndex;
        const isSelected = i === d.selectedIndex;
        let cls = '';
        let tag = '';
        if (isCorrect) { cls = 'correct'; tag = '<span class="tag">Richtig</span>'; }
        else if (isSelected) { cls = 'wrong'; tag = '<span class="tag">Deine Wahl</span>'; }
        return `<li class="${cls}"><span>${escapeHtml(`${LETTERS[i]}. ${text}`)}</span>${tag}</li>`;
      }).join('');

      const notAnswered = d.selectedIndex === null
        ? '<li class="wrong"><span>Keine Antwort ausgewählt</span></li>' : '';

      item.innerHTML = `
        <div class="review-item__head">
          <span class="review-item__num">${idx + 1}.</span>
          <p class="review-item__q"></p>
        </div>
        <ul class="review-answers">${answers}${notAnswered}</ul>
        <p class="review-item__exp"></p>`;
      item.querySelector('.review-item__q').textContent = d.q;
      item.querySelector('.review-item__exp').textContent = d.explanation;
      el.review.appendChild(item);
    });
  }

  // ---- Bestenliste ----
  function renderLeaderboard() {
    if (state.lbMode === 'ndl') { renderNdlRanking(); return; }
    el.lbList.hidden = false;
    el.ndlRanking.hidden = true;
    el.ndlRankingHint.hidden = true;

    Storage.getLeaderboard().then((entries) => {
      el.lbList.innerHTML = '';
      el.lbEmpty.hidden = entries.length > 0;

      entries.forEach((entry, i) => {
        const rank = i + 1;
        const li = document.createElement('li');
        li.className = 'lb-item';
        if (rank <= 3) li.classList.add(`lb-item--top${rank}`);
        if (entry.id && entry.id === state.lastEntryId) li.classList.add('is-me');

        const date = new Date(entry.date);
        const dateStr = isNaN(date) ? '' : date.toLocaleDateString('de-DE');

        li.innerHTML = `
          <span class="lb-rank">${rank <= 3 ? medal(rank) : rank}</span>
          <span class="lb-name">
            <span class="lb-name__text"></span>
            <span class="lb-sub">
              <span class="ndl-chip"></span>
              ${entry.correct}/${entry.total} richtig · ${formatTime(entry.timeMs)} · ${dateStr}
            </span>
          </span>
          <span class="lb-score">
            <span class="lb-score__value">${Number(entry.score).toLocaleString('de-DE')}</span>
            <span class="lb-score__unit">Punkte</span>
          </span>`;
        li.querySelector('.lb-name__text').textContent = entry.name;
        li.querySelector('.ndl-chip').textContent = entry.niederlassung || '—';
        el.lbList.appendChild(li);
      });
    });
  }

  function medal(rank) {
    return { 1: '🥇', 2: '🥈', 3: '🥉' }[rank] || rank;
  }

  function renderNdlRanking() {
    el.lbList.hidden = true;
    el.ndlRanking.hidden = false;

    Promise.all([Storage.getResponses(), Storage.getLeaderboard()])
      .then(([responses, leaderboard]) => {
        const ranking = Analytics.niederlassungRanking(responses, leaderboard);
        el.ndlRanking.innerHTML = '';
        el.lbEmpty.hidden = ranking.length > 0;
        el.ndlRankingHint.hidden = ranking.length === 0;

        ranking.forEach((row, i) => {
          const rank = i + 1;
          const li = document.createElement('li');
          li.className = 'lb-item';
          if (rank <= 3) li.classList.add(`lb-item--top${rank}`);
          if (row.ndl === state.playerNdl) li.classList.add('is-me');

          li.innerHTML = `
            <span class="lb-rank">${rank <= 3 ? medal(rank) : rank}</span>
            <span class="lb-name">
              <span class="lb-name__text"></span>
              <span class="lb-sub">${pct(row.correctRate)} richtig · ${row.plays} ${row.plays === 1 ? 'Teilnahme' : 'Teilnahmen'}</span>
            </span>
            <span class="lb-score">
              <span class="lb-score__value">${row.avgScore.toLocaleString('de-DE')}</span>
              <span class="lb-score__unit">Ø Punkte</span>
            </span>`;
          li.querySelector('.lb-name__text').textContent = row.ndl;
          el.ndlRanking.appendChild(li);
        });
      });
  }

  // ---- Auswertung / Analyse ----
  function openAnalysis() {
    Promise.all([Storage.getResponses(), Storage.getLeaderboard()])
      .then(([responses, leaderboard]) => {
        const hasData = responses.length > 0;
        el.analysisEmpty.hidden = hasData;
        el.analysisContent.hidden = !hasData;
        if (hasData) {
          const data = Analytics.compute(responses, leaderboard, window.QUESTIONS, state.analysisFilter);
          renderAnalysis(data);
        }
        showScreen('analysis');
      });
  }

  function refreshAnalysis() {
    Promise.all([Storage.getResponses(), Storage.getLeaderboard()])
      .then(([responses, leaderboard]) => {
        const data = Analytics.compute(responses, leaderboard, window.QUESTIONS, state.analysisFilter);
        renderAnalysis(data);
      });
  }

  function renderAnalysis(data) {
    renderKpis(data.kpis);
    renderNdlChart(data.byNiederlassung);
    renderQuestionsChart(data.byQuestion);
  }

  function renderKpis(k) {
    const cards = [
      { value: k.plays, label: 'Teilnahmen' },
      { value: pct(k.correctRate), label: 'Trefferquote' },
      { value: k.avgScore.toLocaleString('de-DE'), label: 'Ø Punkte' },
      { value: k.answers.toLocaleString('de-DE'), label: 'Antworten gesamt' }
    ];
    el.kpiGrid.innerHTML = cards.map((c) => `
      <div class="kpi">
        <span class="kpi__value">${c.value}</span>
        <span class="kpi__label">${c.label}</span>
      </div>`).join('');
  }

  function renderNdlChart(rows) {
    // Beim Filtern auf eine Niederlassung ist der Vergleich wenig sinnvoll – ausblenden.
    if (state.analysisFilter) { el.blockNdl.hidden = true; return; }
    el.blockNdl.hidden = false;

    if (rows.length === 0) {
      el.chartNdl.innerHTML = '<p class="muted">Noch keine Daten.</p>';
      return;
    }

    el.chartNdl.innerHTML = rows.map((row) => `
      <div class="bar-row">
        <span class="bar-row__label"></span>
        <div class="bar-row__track">
          <div class="bar-row__fill" style="width:${Math.round(row.correctRate * 100)}%"></div>
          <span class="bar-row__value">${pct(row.correctRate)}</span>
        </div>
        <span class="bar-row__meta">${row.avgScore.toLocaleString('de-DE')} P · ${row.plays}×</span>
      </div>`).join('');

    // Labels per textContent (sicher) nachtragen
    el.chartNdl.querySelectorAll('.bar-row__label').forEach((node, i) => {
      node.textContent = rows[i].ndl;
    });
  }

  function renderQuestionsChart(rows) {
    // Nur Fragen mit mindestens einer Antwort zeigen (sonst verfaelscht "0 %" die Sortierung).
    const sorted = rows.filter((r) => r.total > 0);
    if (sorted.length === 0) {
      el.chartQuestions.innerHTML = '<p class="muted">Für diese Auswahl liegen noch keine beantworteten Fragen vor.</p>';
      return;
    }
    if (state.analysisSort === 'hardest') {
      // Schwerste zuerst: niedrigste Trefferquote oben; bei Gleichstand mehr Antworten zuerst.
      sorted.sort((a, b) => a.correctRate - b.correctRate || b.total - a.total);
    } else {
      sorted.sort((a, b) => a.qId - b.qId);
    }

    el.chartQuestions.innerHTML = '';
    sorted.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'q-item';

      const answered = row.total - row.unanswered;
      const correctPct = row.total > 0 ? (row.correct / row.total) * 100 : 0;
      const wrongCount = row.total - row.correct;
      const wrongPct = row.total > 0 ? (wrongCount / row.total) * 100 : 0;

      const maxOpt = Math.max(1, ...row.options.map((o) => o.count));
      const optionsHtml = row.options.map((o, i) => {
        const w = Math.round((o.count / maxOpt) * 100);
        return `
          <div class="dist-row ${o.isCorrect ? 'is-correct' : ''}">
            <span class="dist-row__key">${LETTERS[i]}</span>
            <span class="dist-row__text"></span>
            <div class="dist-row__track"><div class="dist-row__fill" style="width:${w}%"></div></div>
            <span class="dist-row__count">${o.count}×</span>
          </div>`;
      }).join('');

      item.innerHTML = `
        <button type="button" class="q-item__head" aria-expanded="false">
          <span class="q-item__num badge" data-level="${row.level}">${LEVEL_LABEL[row.level]}</span>
          <span class="q-item__text"></span>
          <span class="q-item__rate">${row.total > 0 ? pct(row.correctRate) : '–'}</span>
        </button>
        <div class="q-item__bar">
          <div class="stack stack--green" style="width:${correctPct}%"></div>
          <div class="stack stack--red" style="width:${wrongPct}%"></div>
        </div>
        <div class="q-item__legend">
          <span class="ok">${row.correct} richtig</span>
          <span class="no">${wrongCount} falsch</span>
          ${row.unanswered ? `<span class="muted">${row.unanswered} ohne Antwort</span>` : ''}
          <span class="muted">${answered}/${row.total} beantwortet</span>
        </div>
        <div class="q-item__dist" hidden>
          <p class="q-item__dist-title">Antwortverteilung</p>
          ${optionsHtml}
        </div>`;

      item.querySelector('.q-item__text').textContent = row.q;
      item.querySelectorAll('.dist-row__text').forEach((node, i) => {
        node.textContent = row.options[i].text;
      });

      const head = item.querySelector('.q-item__head');
      const dist = item.querySelector('.q-item__dist');
      head.addEventListener('click', () => {
        const open = dist.hidden;
        dist.hidden = !open;
        head.setAttribute('aria-expanded', String(open));
        item.classList.toggle('is-open', open);
      });

      el.chartQuestions.appendChild(item);
    });
  }

  // ---- Events ----
  el.startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.nameInput.value.trim();
    const ndl = el.ndlSelect.value;
    let ok = true;
    if (!name) { el.nameError.hidden = false; ok = false; }
    if (!ndl) { el.ndlError.hidden = false; ok = false; }
    if (!ok) { (!name ? el.nameInput : el.ndlSelect).focus(); return; }
    el.nameError.hidden = true;
    el.ndlError.hidden = true;
    startQuiz(name, ndl);
  });

  el.nameInput.addEventListener('input', () => { el.nameError.hidden = true; });
  el.ndlSelect.addEventListener('change', () => { el.ndlError.hidden = true; });

  el.btnNext.addEventListener('click', handleNext);

  el.lbMode.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg__btn');
    if (!btn) return;
    state.lbMode = btn.dataset.mode;
    el.lbMode.querySelectorAll('.seg__btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    renderLeaderboard();
  });

  function gotoLeaderboard() { renderLeaderboard(); showScreen('leaderboard'); }
  el.showLbStart.addEventListener('click', gotoLeaderboard);
  el.btnShowLb.addEventListener('click', gotoLeaderboard);

  el.showAnalysisStart.addEventListener('click', openAnalysis);
  el.btnShowAnalysis.addEventListener('click', openAnalysis);

  el.btnToggleReview.addEventListener('click', () => {
    const willShow = el.review.hidden;
    el.review.hidden = !willShow;
    el.btnToggleReview.textContent = willShow ? 'Auflösung ausblenden' : 'Auflösung anzeigen';
    if (willShow) el.review.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function resetToStart() {
    el.startForm.reset();
    state.lastEntryId = null;
    showScreen('start');
    el.nameInput.focus();
  }
  el.btnRestartResult.addEventListener('click', resetToStart);
  el.btnPlayAgain.addEventListener('click', resetToStart);
  el.btnAnalysisPlay.addEventListener('click', resetToStart);
  el.btnAnalysisBack.addEventListener('click', gotoLeaderboard);

  el.ndlFilter.addEventListener('change', () => {
    state.analysisFilter = el.ndlFilter.value;
    refreshAnalysis();
  });

  el.qSort.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg__btn');
    if (!btn) return;
    state.analysisSort = btn.dataset.sort;
    el.qSort.querySelectorAll('.seg__btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    refreshAnalysis();
  });

  el.btnClear.addEventListener('click', () => {
    const ok = window.confirm(
      'Wirklich ALLE Daten zurücksetzen (Bestenliste und Auswertung)?\nDas kann nicht rückgängig gemacht werden.'
    );
    if (!ok) return;
    Storage.clearAll().then(() => {
      state.lastEntryId = null;
      renderLeaderboard();
    });
  });

  // ---- Init ----
  populateNiederlassungen();
  el.nameInput.focus();
})();
