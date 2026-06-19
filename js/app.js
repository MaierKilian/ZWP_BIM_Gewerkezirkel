/**
 * App-Steuerung: Screen-Wechsel, Quiz-Ablauf, Rendering, Bestenliste.
 * Bindet questions.js, storage.js und quiz.js zusammen.
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
    leaderboard: document.getElementById('screen-leaderboard')
  };

  const el = {
    startForm:        document.getElementById('start-form'),
    nameInput:        document.getElementById('player-name'),
    nameError:        document.getElementById('name-error'),
    showLbStart:      document.getElementById('show-leaderboard-start'),

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
    btnShowLb:        document.getElementById('btn-show-leaderboard'),
    btnToggleReview:  document.getElementById('btn-toggle-review'),
    btnRestartResult: document.getElementById('btn-restart-result'),
    review:           document.getElementById('review'),

    lbList:           document.getElementById('leaderboard-list'),
    lbEmpty:          document.getElementById('leaderboard-empty'),
    btnPlayAgain:     document.getElementById('btn-play-again'),
    btnClear:         document.getElementById('btn-clear')
  };

  // ---- Sitzungszustand ----
  const state = {
    playerName: '',
    session: null,        // aktuelle Quiz.create()-Instanz
    quizStart: 0,         // Zeitstempel Quizbeginn
    questionStart: 0,     // Zeitstempel aktuelle Frage
    selectedIndex: null,  // Auswahl der aktuellen Frage
    lastResult: null,     // Ergebnisobjekt
    lastRank: null,       // Platzierung des letzten Durchlaufs
    lastEntryId: null,    // ID des eigenen Eintrags (Hervorhebung)
    timerId: null
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

  function ordinal(n) {
    return `${n}.`;
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
  function startQuiz(name) {
    state.playerName = name;
    state.session = Quiz.create(window.QUESTIONS);
    state.quizStart = Date.now();
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

    const pct = (session.index / session.total) * 100;
    el.progressFill.style.width = `${pct}%`;

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
  function finishQuiz() {
    stopTimer();
    el.progressFill.style.width = '100%';
    const totalTime = Date.now() - state.quizStart;
    const result = state.session.result(totalTime);
    state.lastResult = result;

    Storage.saveScore({
      name: state.playerName,
      score: result.score,
      correct: result.correct,
      total: result.total,
      timeMs: result.timeMs
    }).then(({ entry, rank }) => {
      state.lastRank = rank;
      state.lastEntryId = entry.id;
      renderResult();
      showScreen('result');
    });
  }

  function renderResult() {
    const r = state.lastResult;
    el.resultName.textContent = state.playerName;
    el.resultRankBadge.textContent = `Platz ${ordinal(state.lastRank)} in der Bestenliste`;
    el.resultScore.textContent = r.score.toLocaleString('de-DE');
    el.resultCorrect.textContent = `${r.correct} / ${r.total}`;
    el.resultTime.textContent = formatTime(r.timeMs);

    el.review.hidden = true;
    el.btnToggleReview.textContent = 'Auflösung anzeigen';
    renderReview(r.details);
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
        const label = `${LETTERS[i]}. `;
        return `<li class="${cls}"><span>${escapeHtml(label + text)}</span>${tag}</li>`;
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Bestenliste ----
  function renderLeaderboard() {
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
            <span class="lb-sub">${entry.correct}/${entry.total} richtig · ${formatTime(entry.timeMs)} · ${dateStr}</span>
          </span>
          <span class="lb-score">
            <span class="lb-score__value">${Number(entry.score).toLocaleString('de-DE')}</span>
            <span class="lb-score__unit">Punkte</span>
          </span>`;
        li.querySelector('.lb-name__text').textContent = entry.name;
        el.lbList.appendChild(li);
      });
    });
  }

  function medal(rank) {
    return { 1: '🥇', 2: '🥈', 3: '🥉' }[rank] || rank;
  }

  // ---- Events ----
  el.startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.nameInput.value.trim();
    if (!name) {
      el.nameError.hidden = false;
      el.nameInput.focus();
      return;
    }
    el.nameError.hidden = true;
    startQuiz(name);
  });

  el.nameInput.addEventListener('input', () => { el.nameError.hidden = true; });

  el.btnNext.addEventListener('click', handleNext);

  el.showLbStart.addEventListener('click', () => {
    renderLeaderboard();
    showScreen('leaderboard');
  });

  el.btnShowLb.addEventListener('click', () => {
    renderLeaderboard();
    showScreen('leaderboard');
  });

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

  el.btnClear.addEventListener('click', () => {
    const ok = window.confirm('Bestenliste wirklich komplett zurücksetzen? Das kann nicht rückgängig gemacht werden.');
    if (!ok) return;
    Storage.clearLeaderboard().then(() => {
      state.lastEntryId = null;
      renderLeaderboard();
    });
  });

  // Startbildschirm fokussieren
  el.nameInput.focus();
})();
