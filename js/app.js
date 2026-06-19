/**
 * App-Steuerung: Screen-Wechsel, Quiz-Ablauf, Bestenliste und Auswertung.
 * Bindet config.js, questions.js, storage.js, quiz.js und analytics.js zusammen.
 */
(() => {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const LEVEL_LABEL = { easy: 'leicht', medium: 'mittel', hard: 'schwer' };
  const TYPE_LABEL = { mc: 'Multiple Choice', truefalse: 'Wahr/Falsch', order: 'Reihenfolge', match: 'Zuordnen' };

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
    resultRank:       document.getElementById('result-rank'),
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
    chartLevel:       document.getElementById('chart-level'),
    chartType:        document.getElementById('chart-type'),
    blockHighlights:  document.getElementById('block-highlights'),
    listFlop:         document.getElementById('list-flop'),
    listTop:          document.getElementById('list-top'),
    blockNdl:         document.getElementById('block-ndl'),
    ndlMetric:        document.getElementById('ndl-metric'),
    chartNdl:         document.getElementById('chart-ndl'),
    chartQuestions:   document.getElementById('chart-questions'),
    qSort:            document.getElementById('q-sort'),
    btnExportPlays:   document.getElementById('btn-export-plays'),
    btnExportAnswers: document.getElementById('btn-export-answers'),
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
    currentAnswer: null,
    answerComplete: false,
    lastResult: null,
    lastRank: null,
    lastEntryId: null,
    timerId: null,
    analysisFilter: '',
    analysisSort: 'hardest',
    ndlMetric: 'rate',
    lastAnalysis: null,
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

  // Setzt die aktuelle Antwort und schaltet den Weiter-Button frei/zu.
  function setAnswer(value, complete) {
    state.currentAnswer = value;
    state.answerComplete = complete;
    el.btnNext.disabled = !complete;
  }

  function renderQuestion() {
    const session = state.session;
    const q = session.current();
    state.questionStart = Date.now();
    setAnswer(null, false);

    el.qCounter.textContent = `Frage ${session.index + 1} / ${session.total}`;
    el.qLevel.textContent = LEVEL_LABEL[q.level];
    el.qLevel.dataset.level = q.level;
    el.qText.textContent = q.q;
    el.qText.classList.toggle('question--withprompt', q.type === 'order' || q.type === 'match');

    el.progressFill.style.width = `${(session.index / session.total) * 100}%`;
    el.btnNext.textContent = session.isLast() ? 'Auswerten' : 'Weiter';

    el.qOptions.innerHTML = '';
    el.qOptions.className = `options options--${q.type}`;
    switch (q.type) {
      case 'truefalse': renderTrueFalse(q); break;
      case 'order':     renderOrder(q); break;
      case 'match':     renderMatch(q); break;
      default:          renderMc(q);
    }
  }

  function renderMc(q) {
    q.options.forEach((text, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.innerHTML = `<span class="option__key">${LETTERS[i]}</span><span class="option__text"></span>`;
      btn.querySelector('.option__text').textContent = text;
      btn.addEventListener('click', () => {
        setAnswer(i, true);
        el.qOptions.querySelectorAll('.option').forEach((o) => o.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
      el.qOptions.appendChild(btn);
    });
  }

  function renderTrueFalse(q) {
    [['Wahr', true], ['Falsch', false]].forEach(([label, val]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `option option--tf option--tf-${val ? 'yes' : 'no'}`;
      btn.innerHTML = `<span class="option__key">${val ? '✓' : '✕'}</span><span class="option__text">${label}</span>`;
      btn.addEventListener('click', () => {
        setAnswer(val, true);
        el.qOptions.querySelectorAll('.option').forEach((o) => o.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
      el.qOptions.appendChild(btn);
    });
  }

  function renderOrder(q) {
    let arr = [...q.start];
    const hint = document.createElement('p');
    hint.className = 'q-prompt';
    hint.textContent = q.prompt;
    el.qOptions.appendChild(hint);

    const list = document.createElement('div');
    list.className = 'order-list';
    el.qOptions.appendChild(list);

    const draw = () => {
      list.innerHTML = '';
      arr.forEach((text, i) => {
        const row = document.createElement('div');
        row.className = 'order-item';
        row.innerHTML = `
          <span class="order-item__pos">${i + 1}</span>
          <span class="order-item__text"></span>
          <span class="order-item__moves">
            <button type="button" class="move-btn" data-dir="up" aria-label="nach oben" ${i === 0 ? 'disabled' : ''}>▲</button>
            <button type="button" class="move-btn" data-dir="down" aria-label="nach unten" ${i === arr.length - 1 ? 'disabled' : ''}>▼</button>
          </span>`;
        row.querySelector('.order-item__text').textContent = text;
        row.querySelector('[data-dir="up"]').addEventListener('click', () => move(i, -1));
        row.querySelector('[data-dir="down"]').addEventListener('click', () => move(i, 1));
        list.appendChild(row);
      });
    };
    const move = (i, dir) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      setAnswer([...arr], true);
      draw();
    };

    draw();
    // Reihenfolge gilt sofort als (vorläufige) Antwort.
    setAnswer([...arr], true);
  }

  function renderMatch(q) {
    const hint = document.createElement('p');
    hint.className = 'q-prompt';
    hint.textContent = q.prompt;
    el.qOptions.appendChild(hint);

    const selected = new Array(q.lefts.length).fill(null);
    const grid = document.createElement('div');
    grid.className = 'match-list';
    el.qOptions.appendChild(grid);

    q.lefts.forEach((left, i) => {
      const row = document.createElement('div');
      row.className = 'match-row';
      const sel = document.createElement('select');
      sel.className = 'form__input form__input--compact match-select';
      sel.innerHTML = '<option value="" disabled selected>auswählen …</option>';
      q.rights.forEach((right) => {
        const opt = document.createElement('option');
        opt.value = right; opt.textContent = right;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => {
        selected[i] = sel.value;
        const complete = selected.every((v) => v !== null);
        setAnswer([...selected], complete);
      });

      const leftEl = document.createElement('span');
      leftEl.className = 'match-row__left';
      leftEl.textContent = left;

      row.appendChild(leftEl);
      row.appendChild(sel);
      grid.appendChild(row);
    });
  }

  function handleNext() {
    if (!state.answerComplete) return;
    const session = state.session;
    session.answer(state.currentAnswer, Date.now() - state.questionStart);

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
      type: d.type,
      niederlassung: state.playerNdl,
      isCorrect: d.isCorrect,
      answered: d.answered,
      chosenText: d.chosenText,
      correctText: d.correctText,
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
    el.resultRankBadge.textContent = `Niederlassung ${state.playerNdl}`;
    el.resultScore.textContent = `${r.score} / ${r.total}`;
    el.resultRank.textContent = `${state.lastRank}.`;
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

  function reviewBodyMc(d) {
    const rt = d.rt;
    const answers = rt.options.map((text, i) => {
      const isCorrect = i === rt.correctIndex;
      const isSelected = i === d.value;
      let cls = '', tag = '';
      if (isCorrect) { cls = 'correct'; tag = '<span class="tag">Richtig</span>'; }
      else if (isSelected) { cls = 'wrong'; tag = '<span class="tag">Deine Wahl</span>'; }
      return `<li class="${cls}"><span>${escapeHtml(`${LETTERS[i]}. ${text}`)}</span>${tag}</li>`;
    }).join('');
    const none = !d.answered ? '<li class="wrong"><span>Keine Antwort ausgewählt</span></li>' : '';
    return `<ul class="review-answers">${answers}${none}</ul>`;
  }

  function reviewBodyTrueFalse(d) {
    const rt = d.rt;
    const items = [['Wahr', true], ['Falsch', false]].map(([label, val]) => {
      const isCorrect = val === rt.answer;
      const isSelected = val === d.value;
      let cls = '', tag = '';
      if (isCorrect) { cls = 'correct'; tag = '<span class="tag">Richtig</span>'; }
      else if (isSelected) { cls = 'wrong'; tag = '<span class="tag">Deine Wahl</span>'; }
      return `<li class="${cls}"><span>${escapeHtml(label)}</span>${tag}</li>`;
    }).join('');
    return `<ul class="review-answers">${items}</ul>`;
  }

  function reviewBodyOrder(d) {
    const rt = d.rt;
    const user = Array.isArray(d.value) ? d.value : [];
    const mine = rt.correct.map((_, i) => {
      const text = user[i];
      const ok = text === rt.correct[i];
      return `<li class="${ok ? 'correct' : 'wrong'}"><span>${escapeHtml(`${i + 1}. ${text || '—'}`)}</span></li>`;
    }).join('');
    const right = rt.correct.map((text, i) =>
      `<li class="correct"><span>${escapeHtml(`${i + 1}. ${text}`)}</span></li>`).join('');
    return `
      <div class="review-cols">
        <div><p class="review-col-title">Deine Reihenfolge</p><ul class="review-answers">${mine}</ul></div>
        <div><p class="review-col-title">Richtige Reihenfolge</p><ul class="review-answers">${right}</ul></div>
      </div>`;
  }

  function reviewBodyMatch(d) {
    const rt = d.rt;
    const user = Array.isArray(d.value) ? d.value : [];
    const rows = rt.lefts.map((left, i) => {
      const chosen = user[i];
      const correct = rt.correct[i];
      const ok = chosen === correct;
      const yourLine = `<span class="match-rev__pick ${ok ? 'correct' : 'wrong'}">${escapeHtml(chosen || '—')}</span>`;
      const fix = ok ? '' : `<span class="match-rev__fix">→ ${escapeHtml(correct)}</span>`;
      return `<li><span class="match-rev__left">${escapeHtml(left)}</span> ${yourLine} ${fix}</li>`;
    }).join('');
    return `<ul class="review-answers review-answers--match">${rows}</ul>`;
  }

  function renderReview(details) {
    el.review.innerHTML = '';
    details.forEach((d, idx) => {
      const item = document.createElement('div');
      item.className = `review-item ${d.isCorrect ? 'is-correct' : 'is-wrong'}`;

      let body;
      switch (d.type) {
        case 'truefalse': body = reviewBodyTrueFalse(d); break;
        case 'order':     body = reviewBodyOrder(d); break;
        case 'match':     body = reviewBodyMatch(d); break;
        default:          body = reviewBodyMc(d);
      }

      item.innerHTML = `
        <div class="review-item__head">
          <span class="review-item__num">${idx + 1}.</span>
          <p class="review-item__q"></p>
        </div>
        ${body}
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
    state.lastAnalysis = data;
    renderKpis(data.kpis);
    renderBreakdown(data);
    renderHighlights(data.byQuestion);
    renderNdlChart(data.byNiederlassung);
    renderQuestionsChart(data.byQuestion);
  }

  function renderKpis(k) {
    const cards = [
      { value: k.plays, label: 'Teilnahmen' },
      { value: k.players, label: 'Teilnehmende' },
      { value: pct(k.correctRate), label: 'Trefferquote' },
      { value: k.avgScore.toLocaleString('de-DE'), label: 'Ø Punkte' },
      { value: k.bestScore.toLocaleString('de-DE'), label: 'Bestwert' },
      { value: k.avgTimeMs ? formatTime(k.avgTimeMs) : '–', label: 'Ø Dauer' }
    ];
    el.kpiGrid.innerHTML = cards.map((c) => `
      <div class="kpi">
        <span class="kpi__value">${c.value}</span>
        <span class="kpi__label">${c.label}</span>
      </div>`).join('');
  }

  // Mini-Balkendiagramm (Label + Trefferquote) für Schwierigkeit/Typ
  function miniBars(container, rows, labelFn) {
    if (rows.length === 0) { container.innerHTML = '<p class="muted">Keine Daten.</p>'; return; }
    container.innerHTML = rows.map((r) => `
      <div class="mbar">
        <span class="mbar__label"></span>
        <div class="mbar__track"><div class="mbar__fill" style="width:${Math.round(r.correctRate * 100)}%"></div></div>
        <span class="mbar__val">${pct(r.correctRate)} <span class="muted">(${r.correct}/${r.total})</span></span>
      </div>`).join('');
    container.querySelectorAll('.mbar__label').forEach((node, i) => {
      node.textContent = labelFn(rows[i].key);
    });
  }

  function renderBreakdown(data) {
    miniBars(el.chartLevel, data.byLevel, (k) => LEVEL_LABEL[k] || k);
    miniBars(el.chartType, data.byType, (k) => TYPE_LABEL[k] || k);
  }

  function renderHighlights(byQuestion) {
    const answered = byQuestion.filter((q) => q.total > 0);
    if (answered.length === 0) { el.blockHighlights.hidden = true; return; }
    el.blockHighlights.hidden = false;

    const flop = [...answered].sort((a, b) => a.correctRate - b.correctRate || b.total - a.total).slice(0, 3);
    const top = [...answered].sort((a, b) => b.correctRate - a.correctRate || b.total - a.total).slice(0, 3);

    const fill = (listEl, rows) => {
      listEl.innerHTML = '';
      rows.forEach((r) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="highlight-rate">${pct(r.correctRate)}</span><span class="highlight-q"></span>`;
        li.querySelector('.highlight-q').textContent = r.q;
        listEl.appendChild(li);
      });
    };
    fill(el.listFlop, flop);
    fill(el.listTop, top);
  }

  function renderNdlChart(rows) {
    // Beim Filtern auf eine Niederlassung ist der Vergleich wenig sinnvoll – ausblenden.
    if (state.analysisFilter) { el.blockNdl.hidden = true; return; }
    el.blockNdl.hidden = false;

    if (rows.length === 0) {
      el.chartNdl.innerHTML = '<p class="muted">Noch keine Daten.</p>';
      return;
    }

    const byScore = state.ndlMetric === 'score';
    const maxScore = Math.max(1, ...rows.map((r) => r.avgScore));
    // Reihen nach gewählter Kennzahl sortieren
    const sorted = [...rows].sort((a, b) =>
      byScore ? (b.avgScore - a.avgScore) : (b.correctRate - a.correctRate));

    el.chartNdl.innerHTML = sorted.map((row) => {
      const width = byScore ? Math.round((row.avgScore / maxScore) * 100) : Math.round(row.correctRate * 100);
      const value = byScore ? `${row.avgScore.toLocaleString('de-DE')} P` : pct(row.correctRate);
      return `
        <div class="bar-row">
          <span class="bar-row__label"></span>
          <div class="bar-row__track">
            <div class="bar-row__fill" style="width:${width}%"></div>
            <span class="bar-row__value">${value}</span>
          </div>
          <span class="bar-row__meta">${pct(row.correctRate)} · ${row.avgScore.toLocaleString('de-DE')} P · ${row.plays}×</span>
        </div>`;
    }).join('');

    el.chartNdl.querySelectorAll('.bar-row__label').forEach((node, i) => {
      node.textContent = sorted[i].ndl;
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

      const hasDist = row.options.length > 0;
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

      const distHtml = hasDist ? `
        <div class="q-item__dist" hidden>
          <p class="q-item__dist-title">Antwortverteilung</p>
          ${optionsHtml}
        </div>` : '';

      item.innerHTML = `
        <button type="button" class="q-item__head" aria-expanded="false" ${hasDist ? '' : 'data-nodist="1"'}>
          <span class="q-item__num badge" data-level="${row.level}">${LEVEL_LABEL[row.level]}</span>
          <span class="q-item__type">${TYPE_LABEL[row.type] || ''}</span>
          <span class="q-item__text"></span>
          <span class="q-item__rate">${pct(row.correctRate)}</span>
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
        ${distHtml}`;

      item.querySelector('.q-item__text').textContent = row.q;
      if (hasDist) {
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
      }

      el.chartQuestions.appendChild(item);
    });
  }

  // ---- CSV-Export ----
  function toCsv(headers, rows) {
    const esc = (v) => {
      const s = (v === null || v === undefined) ? '' : String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(';'), ...rows.map((r) => r.map(esc).join(';'))];
    return '﻿' + lines.join('\r\n'); // BOM für Excel/Umlaute
  }

  function downloadCsv(filename, content) {
    try {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.warn('Export fehlgeschlagen:', err);
      window.alert('Export wird in diesem Browser nicht unterstützt.');
    }
  }

  function dateStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function exportPlays() {
    Storage.getLeaderboard().then((entries) => {
      if (entries.length === 0) { window.alert('Noch keine Daten zum Exportieren.'); return; }
      const headers = ['Platz', 'Name', 'Niederlassung', 'Punkte', 'Richtig', 'Gesamt', 'Dauer_Sek', 'Datum'];
      const rows = entries.map((e, i) => [
        i + 1, e.name, e.niederlassung, e.score, e.correct, e.total,
        Math.round((e.timeMs || 0) / 1000),
        new Date(e.date).toLocaleString('de-DE')
      ]);
      downloadCsv(`zwp-bim-quiz_teilnahmen_${dateStamp()}.csv`, toCsv(headers, rows));
    });
  }

  function exportAnswers() {
    Storage.getResponses().then((responses) => {
      if (responses.length === 0) { window.alert('Noch keine Daten zum Exportieren.'); return; }
      const byId = {};
      (window.QUESTIONS || []).forEach((q) => { byId[q.id] = q; });
      const headers = ['Frage_ID', 'Niederlassung', 'Schwierigkeit', 'Typ', 'Richtig', 'Gewählte_Antwort', 'Richtige_Antwort', 'Frage', 'Datum'];
      const rows = responses.map((r) => [
        r.qId, r.niederlassung, r.level, r.type || 'mc',
        r.isCorrect ? 'ja' : 'nein',
        r.chosenText || '', r.correctText || '',
        byId[r.qId] ? byId[r.qId].q : '',
        new Date(r.date).toLocaleString('de-DE')
      ]);
      downloadCsv(`zwp-bim-quiz_antworten_${dateStamp()}.csv`, toCsv(headers, rows));
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
    if (state.lastAnalysis) renderQuestionsChart(state.lastAnalysis.byQuestion);
  });

  el.ndlMetric.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg__btn');
    if (!btn) return;
    state.ndlMetric = btn.dataset.metric;
    el.ndlMetric.querySelectorAll('.seg__btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    if (state.lastAnalysis) renderNdlChart(state.lastAnalysis.byNiederlassung);
  });

  el.btnExportPlays.addEventListener('click', exportPlays);
  el.btnExportAnswers.addEventListener('click', exportAnswers);

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
