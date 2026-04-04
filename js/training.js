/* ============================================================
   GCI 3D Printing Lab — js/training.js
   Day 2: From Model to Print Setup
   All interactive functions are attached to window.* so that
   inline onclick handlers work correctly with the defer attr.
   ============================================================ */

/* ── Storage Keys ──────────────────────────────────────────── */
const STORAGE_THEME    = 'gci-day2-theme';
const STORAGE_FONTSIZE = 'gci-day2-fontsize';
const STORAGE_PROGRESS = 'gci-day2-completed';
const STORAGE_QUIZ     = 'gci-day2-quiz';
const STORAGE_MATCHING = 'gci-day2-matching';
const STORAGE_TROUBLE  = 'gci-day2-trouble';

/* ── Constants ─────────────────────────────────────────────── */
const TOTAL_PARTS = 7;

/* ── Module-level state ────────────────────────────────────── */
let completedParts = [];

/* ============================================================
   1. THEME SYSTEM
   ============================================================ */

/**
 * Applies the specified theme to <body>.
 * 'auto' detects the OS color-scheme preference.
 * Stores selection in localStorage.
 * @param {string} theme - 'auto' | 'dark' | 'light' | 'high-contrast'
 */
window.applyTheme = function applyTheme(theme) {
  let resolved = theme;
  if (theme === 'auto') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (resolved === 'dark') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', resolved);
  }
  localStorage.setItem(STORAGE_THEME, theme); // store the raw selection (including 'auto')
};

/**
 * Applies the specified font-size scale to <body>.
 * @param {string} size - 'default' | 'large' | 'x-large'
 */
window.applyFontSize = function applyFontSize(size) {
  if (size === 'default') {
    document.body.removeAttribute('data-font-size');
  } else {
    document.body.setAttribute('data-font-size', size);
  }
  localStorage.setItem(STORAGE_FONTSIZE, size);
};

/* ============================================================
   2. PROGRESS TRACKING
   ============================================================ */

/** Re-renders the progress bar and step counter. */
function updateProgress() {
  const pct = Math.round((completedParts.length / TOTAL_PARTS) * 100);
  const fill = document.getElementById('progressFill');
  const pctEl = document.getElementById('progressPercent');
  const stepEl = document.getElementById('progressStep');
  const bar = fill && fill.closest('[role="progressbar"]');

  if (fill) fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  if (bar) bar.setAttribute('aria-valuenow', pct);

  // Determine current (first incomplete) step
  let currentStep = TOTAL_PARTS;
  for (let i = 1; i <= TOTAL_PARTS; i++) {
    if (!completedParts.includes(i)) {
      currentStep = i;
      break;
    }
  }
  if (stepEl) stepEl.textContent = 'Step ' + currentStep + ' of ' + TOTAL_PARTS;
}

/**
 * Updates each details card's CSS class and badge text
 * based on completedParts. Also disables/enables buttons.
 */
function updateCardStates() {
  for (let n = 1; n <= TOTAL_PARTS; n++) {
    const card  = document.getElementById('part' + n);
    const badge = document.getElementById('badge' + n);
    if (!card) continue;

    const isDone   = completedParts.includes(n);
    const isLocked = n > 1 && !completedParts.includes(n - 1);
    const isActive = !isDone && !isLocked;

    // Update CSS class
    card.classList.remove('active-card', 'completed-card', 'locked-card');
    if (isDone)        card.classList.add('completed-card');
    else if (isLocked) card.classList.add('locked-card');
    else               card.classList.add('active-card');

    // Update badge
    if (badge) {
      badge.textContent = isDone ? 'Complete' : isLocked ? 'Locked' : 'Active';
      badge.className = 'state-badge ' + (isDone ? 'completed' : isLocked ? 'locked' : 'active');
    }

    // Enable/disable the standard Mark Complete button (if it has no specific id)
    const allBtns = card.querySelectorAll('button[onclick*="window.complete"]');
    allBtns.forEach(btn => {
      // Named buttons (completePart4/5/6) are managed by their own logic; skip them.
      if (!btn.id) {
        btn.disabled = isLocked;
      }
    });

    // Locked cards should not be openable
    if (isLocked) {
      card.removeAttribute('open');
    }
  }
}

/* ============================================================
   3. MARK COMPLETE
   ============================================================ */

/**
 * Marks a part as complete, saves state, opens the next part,
 * and refreshes progress UI.
 * @param {number} partNum - The part number to mark complete (1–7).
 */
window.complete = function complete(partNum) {
  if (!completedParts.includes(partNum)) {
    completedParts.push(partNum);
    localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(completedParts));
  }

  // Close current part
  const current = document.getElementById('part' + partNum);
  if (current) current.removeAttribute('open');

  // Open next part (if it exists and is now unlocked)
  const next = document.getElementById('part' + (partNum + 1));
  if (next) {
    next.setAttribute('open', '');
    // Scroll to it smoothly
    setTimeout(() => next.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  updateProgress();
  updateCardStates();
};

/* ============================================================
   4. QUIZ — Part 3
   ============================================================ */

const quizQuestions = [
  {
    prompt: "What is Bambu Studio primarily used for?",
    type: "mcq",
    options: [
      "Designing 3D models from scratch",
      "Slicing and preparing 3D models for printing",
      "Connecting to the internet",
      "Painting 3D printed objects"
    ],
    correct: 1,
    explanation: "Bambu Studio is a slicing app. It converts your 3D model into layer-by-layer print instructions (G-code) that your Bambu printer understands."
  },
  {
    prompt: "What does 'slicing' a 3D model mean?",
    type: "mcq",
    options: [
      "Cutting the physical model with a tool",
      "Designing a new model",
      "Converting a 3D model into layer-by-layer printer instructions",
      "Uploading a file to MakerWorld"
    ],
    correct: 2,
    explanation: "Slicing breaks your model into horizontal layers and generates the G-code (movement and temperature instructions) that drives the printer."
  },
  {
    prompt: "Which of the following can you adjust in Bambu Studio? Select ALL that apply.",
    type: "multi",
    options: ["Layer height", "Infill percentage", "Support structures", "Print speed"],
    correct: [0, 1, 2, 3],
    explanation: "All four are adjustable! Layer height affects detail, infill controls internal density, supports hold up overhangs, and speed balances quality vs. time."
  },
  {
    prompt: "What does the Preview feature in Bambu Studio show you?",
    type: "mcq",
    options: [
      "A photo of the finished print",
      "A layer-by-layer simulation of how the print will be built",
      "A list of your saved models",
      "The cost of the filament"
    ],
    correct: 1,
    explanation: "Preview lets you scrub through every layer before printing — great for spotting missing supports or unexpected gaps before wasting filament."
  },
  {
    prompt: "Why should you always check the sliced preview before printing?",
    type: "mcq",
    options: [
      "It makes the print faster",
      "It changes the filament color",
      "It helps you catch errors, verify supports, and estimate print time",
      "It is required by Bambu to activate the printer"
    ],
    correct: 2,
    explanation: "Reviewing the preview saves filament and time. You can catch errors, confirm support placement, and see the estimated print time before committing."
  }
];

// In-memory quiz state (also mirrored to localStorage)
let quizState = { current: 0, answers: {}, checked: {} };

/** Persists quiz state to localStorage. */
function saveQuizState() {
  localStorage.setItem(STORAGE_QUIZ, JSON.stringify(quizState));
}

/** Renders the current quiz question into the DOM. */
function renderQuiz() {
  const idx = quizState.current;
  const q   = quizQuestions[idx];
  if (!q) return;

  // Progress text
  const prog = document.getElementById('quizProgress');
  if (prog) prog.textContent = 'Question ' + (idx + 1) + ' of ' + quizQuestions.length;

  // Prompt
  const qText = document.getElementById('qText');
  if (qText) qText.textContent = q.prompt;

  // Options
  const qOptions = document.getElementById('qOptions');
  if (!qOptions) return;
  qOptions.innerHTML = '';

  const savedAnswer = quizState.answers[idx];
  const isChecked   = !!quizState.checked[idx];

  if (q.type === 'mcq') {
    q.options.forEach((opt, i) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type  = 'radio';
      radio.name  = 'quizQ';
      radio.value = i;
      if (savedAnswer === i) radio.checked = true;
      if (isChecked) radio.disabled = true;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + opt));
      const wrapper = document.createElement('div');
      wrapper.appendChild(label);
      qOptions.appendChild(wrapper);
    });
  } else {
    // multi-select (checkboxes)
    q.options.forEach((opt, i) => {
      const label = document.createElement('label');
      const cb    = document.createElement('input');
      cb.type     = 'checkbox';
      cb.name     = 'quizQ';
      cb.value    = i;
      if (Array.isArray(savedAnswer) && savedAnswer.includes(i)) cb.checked = true;
      if (isChecked) cb.disabled = true;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + opt));
      const wrapper = document.createElement('div');
      wrapper.appendChild(label);
      qOptions.appendChild(wrapper);
    });
  }

  // Restore feedback if already checked
  const fb   = document.getElementById('feedback');
  const expl = document.getElementById('explanation');
  const next = document.getElementById('nextBtn');

  if (fb)   fb.textContent   = '';
  if (expl) expl.textContent = '';
  fb && fb.classList.remove('correct', 'incorrect');

  if (isChecked) {
    const correct = isAnswerCorrect(idx);
    if (fb) {
      fb.textContent = correct ? '✅ Correct!' : '❌ Not quite.';
      fb.classList.add(correct ? 'correct' : 'incorrect');
    }
    if (expl) expl.textContent = q.explanation;
    if (next) next.disabled = false;
  } else {
    if (next) next.disabled = true;
  }
}

/** Returns true if the stored answer for index idx is correct. */
function isAnswerCorrect(idx) {
  const q   = quizQuestions[idx];
  const ans = quizState.answers[idx];
  if (q.type === 'multi') {
    if (!Array.isArray(ans)) return false;
    const correct = [...q.correct].sort();
    const given   = [...ans].sort();
    return JSON.stringify(correct) === JSON.stringify(given);
  }
  return ans === q.correct;
}

/** Reads the currently selected option(s) from the DOM. */
function readCurrentSelection(idx) {
  const q = quizQuestions[idx];
  if (q.type === 'mcq') {
    const sel = document.querySelector('input[name="quizQ"]:checked');
    return sel ? parseInt(sel.value, 10) : null;
  } else {
    const checked = document.querySelectorAll('input[name="quizQ"]:checked');
    return Array.from(checked).map(el => parseInt(el.value, 10));
  }
}

window.checkAnswer = function checkAnswer() {
  const idx = quizState.current;
  const q   = quizQuestions[idx];
  const sel = readCurrentSelection(idx);

  // Validate selection
  if (q.type === 'mcq' && sel === null) {
    const fb = document.getElementById('feedback');
    if (fb) { fb.textContent = 'Please select an answer.'; fb.classList.remove('correct', 'incorrect'); }
    return;
  }
  if (q.type === 'multi' && (!Array.isArray(sel) || sel.length === 0)) {
    const fb = document.getElementById('feedback');
    if (fb) { fb.textContent = 'Please select at least one answer.'; fb.classList.remove('correct', 'incorrect'); }
    return;
  }

  // Save selection and mark as checked
  quizState.answers[idx] = sel;
  quizState.checked[idx] = true;
  saveQuizState();

  const correct = isAnswerCorrect(idx);
  const fb   = document.getElementById('feedback');
  const expl = document.getElementById('explanation');
  const next = document.getElementById('nextBtn');

  if (fb) {
    fb.textContent = correct ? '✅ Correct!' : '❌ Not quite — read the explanation below.';
    fb.classList.remove('correct', 'incorrect');
    fb.classList.add(correct ? 'correct' : 'incorrect');
  }
  if (expl) expl.textContent = q.explanation;

  // Disable all inputs after checking
  document.querySelectorAll('input[name="quizQ"]').forEach(el => el.disabled = true);

  // Enable Next (or it's the last question, allow submit / just leave enabled)
  if (next) next.disabled = false;
};

window.nextQuestion = function nextQuestion() {
  if (quizState.current < quizQuestions.length - 1) {
    quizState.current++;
    saveQuizState();
    renderQuiz();
  }
};

window.prevQuestion = function prevQuestion() {
  if (quizState.current > 0) {
    quizState.current--;
    saveQuizState();
    renderQuiz();
  }
};

window.resetQuiz = function resetQuiz() {
  quizState = { current: 0, answers: {}, checked: {} };
  saveQuizState();
  renderQuiz();
};

/* ============================================================
   5. MATCHING ACTIVITY — Part 4
   ============================================================ */

const matchingPairs = [
  { term: "Import Model",    correct: "Drag a .STL or .3MF file into the workspace" },
  { term: "Printer Profile", correct: "Select your specific Bambu printer model and settings" },
  { term: "Slice",           correct: "Convert the 3D model into layer-by-layer print instructions" },
  { term: "Preview",         correct: "See a layer-by-layer simulation before you print" }
];

// In-memory matching state
let matchingState = { attempts: 0, answers: {} };

/** Fisher-Yates shuffle (returns a new array). */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Builds the matching activity HTML inside #matchingActivity. */
function renderMatching() {
  const container = document.getElementById('matchingActivity');
  if (!container) return;

  // Shuffle definitions once for consistent option order in this render
  const defs = shuffle(matchingPairs.map(p => p.correct));

  let html = '<div class="match-grid">';
  matchingPairs.forEach((pair, i) => {
    const saved = matchingState.answers[i] || '';
    html += `
      <div class="match-row" id="matchRow${i}">
        <span class="match-term">${pair.term}</span>
        <select id="matchSel${i}" aria-label="Definition for ${pair.term}">
          <option value="">-- Select a definition --</option>
          ${defs.map(d => `<option value="${d}"${d === saved ? ' selected' : ''}>${d}</option>`).join('')}
        </select>
        <span class="match-result" id="matchResult${i}" aria-hidden="true"></span>
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;

  // Clear old feedback
  const fb = document.getElementById('matchingFeedback');
  if (fb) { fb.textContent = ''; fb.classList.remove('correct', 'incorrect'); }

  // Hide hint
  const hint = document.getElementById('hintBoxMatching');
  if (hint) hint.style.display = 'none';
}

window.checkMatching = function checkMatching() {
  // Read current selections
  matchingPairs.forEach((_, i) => {
    const sel = document.getElementById('matchSel' + i);
    if (sel) matchingState.answers[i] = sel.value;
  });

  matchingState.attempts++;
  localStorage.setItem(STORAGE_MATCHING, JSON.stringify(matchingState));

  let numCorrect = 0;
  matchingPairs.forEach((pair, i) => {
    const resultEl = document.getElementById('matchResult' + i);
    const isCorrect = matchingState.answers[i] === pair.correct;
    if (isCorrect) numCorrect++;
    if (resultEl) resultEl.textContent = isCorrect ? '✓' : '✗';
  });

  const fb = document.getElementById('matchingFeedback');
  if (fb) {
    fb.textContent = numCorrect + ' of 4 correct.';
    fb.classList.remove('correct', 'incorrect');
    fb.classList.add(numCorrect >= 3 ? 'correct' : 'incorrect');
  }

  // Unlock Part 4 complete button if 3+ correct
  const completeBtn = document.getElementById('completePart4');
  if (completeBtn) completeBtn.disabled = numCorrect < 3;

  // Show hint after 2+ attempts when not all correct
  const hint = document.getElementById('hintBoxMatching');
  if (hint && matchingState.attempts >= 2 && numCorrect < 4) {
    hint.style.display = 'block';
  }
};

window.resetMatching = function resetMatching() {
  matchingState = { attempts: 0, answers: {} };
  localStorage.removeItem(STORAGE_MATCHING);
  const completeBtn = document.getElementById('completePart4');
  if (completeBtn) completeBtn.disabled = true;
  renderMatching();
};

/* ============================================================
   6. TROUBLESHOOTING ACTIVITY — Part 5
   ============================================================ */

const troubleScenarios = [
  {
    scenario: "You downloaded a tall, thin figure. The bottom prints perfectly, but halfway up it starts leaning and eventually falls over.",
    options: [
      "The layer height is too large",
      "The model needs support structures",
      "The wrong filament color was selected",
      "The bed is not heating up"
    ],
    correct: 1,
    explanation: "Tall, thin models are unstable mid-print. Support structures (or a brim/raft) help anchor them and prevent tipping.",
    hint: "Think about what physically keeps a tall, wobbly structure from falling over during printing."
  },
  {
    scenario: "Your model has a lot of overhangs. The first layers look great, but the overhanging parts are droopy and stringy.",
    options: [
      "Print speed is too fast",
      "No supports were added for the overhangs",
      "Too much infill was used",
      "The printer nozzle is clogged"
    ],
    correct: 1,
    explanation: "Overhangs beyond about 45° need supports. Without them, the filament is extruded into mid-air and sags.",
    hint: "Filament needs something to rest on. What does Bambu Studio let you add for overhanging sections?"
  },
  {
    scenario: "You printed a model with very fine details — tiny text and thin ridges. After printing, the details are blobby and hard to see.",
    options: [
      "The layer height is too large",
      "Too many supports were added",
      "The wrong printer was selected in Bambu Studio",
      "The model file is corrupted"
    ],
    correct: 0,
    explanation: "A large layer height makes thick layers that blur fine details. Lowering the layer height (e.g., 0.1 mm) gives more precision, at the cost of a longer print.",
    hint: "Think about how thick each printed layer is and how that affects tiny surface features."
  },
  {
    scenario: "You are printing a large, flat part. It looks fine at first, but the corners start lifting off the bed mid-print.",
    options: [
      "The print speed is too slow",
      "There is not enough infill",
      "Bed adhesion is the problem",
      "The filament is expired"
    ],
    correct: 2,
    explanation: "Large flat parts can warp as they cool unevenly, causing corners to lift. Solutions: use a brim or raft, keep bed temp correct, and make sure the build plate is clean.",
    hint: "What keeps the print stuck to the bed? What happens when plastic cools unevenly?"
  }
];

// In-memory troubleshooting state
let troubleState = { current: 0, answers: {}, checked: {}, attempts: {}, correct: [] };

/** Saves troubleshooting state to localStorage. */
function saveTroubleState() {
  localStorage.setItem(STORAGE_TROUBLE, JSON.stringify(troubleState));
}

/** Rebuilds the progress dot indicators. */
function renderTroubleDots() {
  const dots = document.getElementById('troubleDots');
  if (!dots) return;
  dots.innerHTML = troubleScenarios.map((_, i) => {
    let cls = 'progress-dot';
    if (troubleState.correct.includes(i) || (troubleState.checked[i] && troubleState.answers[i] === troubleScenarios[i].correct)) {
      cls += ' done';
    } else if (i === troubleState.current) {
      cls += ' current';
    }
    return `<span class="${cls}" aria-hidden="true"></span>`;
  }).join('');
}

/** Renders the current troubleshooting scenario. */
function renderTrouble() {
  const idx = troubleState.current;
  const s   = troubleScenarios[idx];
  if (!s) return;

  const prog     = document.getElementById('troubleProgress');
  const scenario = document.getElementById('troubleScenario');
  const opts     = document.getElementById('troubleOptions');
  const fb       = document.getElementById('troubleFeedback');
  const expl     = document.getElementById('troubleExplanation');
  const hint     = document.getElementById('hintBoxTrouble');
  const next     = document.getElementById('troubleNextBtn');

  if (prog)     prog.textContent     = 'Scenario ' + (idx + 1) + ' of ' + troubleScenarios.length;
  if (scenario) scenario.textContent = '"' + s.scenario + '"';

  if (opts) {
    const savedAns  = troubleState.answers[idx];
    const isChecked = !!troubleState.checked[idx];
    opts.innerHTML = s.options.map((opt, i) => {
      const checked  = savedAns === i ? ' checked' : '';
      const disabled = isChecked ? ' disabled' : '';
      return `<div><label><input type="radio" name="troubleQ" value="${i}"${checked}${disabled}> ${opt}</label></div>`;
    }).join('');
  }

  // Clear feedback
  if (fb)   { fb.textContent = ''; fb.classList.remove('correct', 'incorrect'); }
  if (expl) expl.textContent = '';
  if (hint) { hint.style.display = 'none'; hint.textContent = ''; }
  if (next) next.disabled = true;

  // Restore feedback if already checked
  if (troubleState.checked[idx]) {
    const correct = troubleState.answers[idx] === s.correct;
    if (fb) {
      fb.textContent = correct ? '✅ Correct!' : '❌ Not quite — read the explanation below.';
      fb.classList.add(correct ? 'correct' : 'incorrect');
    }
    if (expl) expl.textContent = s.explanation;
    if (next) next.disabled = false;

    // Show hint if 2+ failed attempts
    const attempts = troubleState.attempts[idx] || 0;
    if (!correct && attempts >= 2 && hint) {
      hint.textContent = '💡 Hint: ' + s.hint;
      hint.style.display = 'block';
    }
  }

  renderTroubleDots();
  checkTroubleMastery();
}

/** Checks if mastery (3/4 correct) has been reached and updates UI. */
function checkTroubleMastery() {
  // Count distinct correct scenarios
  let correctCount = 0;
  troubleScenarios.forEach((s, i) => {
    if (troubleState.checked[i] && troubleState.answers[i] === s.correct) correctCount++;
  });

  const mastery    = correctCount >= 3;
  const masteryMsg = document.getElementById('masteryMsg');
  const completeBtn = document.getElementById('completePart5');

  if (masteryMsg) masteryMsg.style.display = mastery ? 'block' : 'none';
  if (completeBtn) completeBtn.disabled = !mastery;

  return mastery;
}

window.checkTrouble = function checkTrouble() {
  const idx = troubleState.current;
  const s   = troubleScenarios[idx];
  const sel = document.querySelector('input[name="troubleQ"]:checked');

  if (!sel) {
    const fb = document.getElementById('troubleFeedback');
    if (fb) { fb.textContent = 'Please select an answer.'; fb.classList.remove('correct', 'incorrect'); }
    return;
  }

  const answer = parseInt(sel.value, 10);
  troubleState.answers[idx] = answer;
  troubleState.checked[idx] = true;
  troubleState.attempts[idx] = (troubleState.attempts[idx] || 0) + 1;
  saveTroubleState();

  const correct = answer === s.correct;
  const fb   = document.getElementById('troubleFeedback');
  const expl = document.getElementById('troubleExplanation');
  const hint = document.getElementById('hintBoxTrouble');
  const next = document.getElementById('troubleNextBtn');

  if (fb) {
    fb.textContent = correct ? '✅ Correct!' : '❌ Not quite — read the explanation below.';
    fb.classList.remove('correct', 'incorrect');
    fb.classList.add(correct ? 'correct' : 'incorrect');
  }
  if (expl) expl.textContent = s.explanation;
  if (next) next.disabled = false;

  // Disable options after checking
  document.querySelectorAll('input[name="troubleQ"]').forEach(el => el.disabled = true);

  // Show hint after 2+ failed attempts on this scenario
  if (!correct && troubleState.attempts[idx] >= 2 && hint) {
    hint.textContent = '💡 Hint: ' + s.hint;
    hint.style.display = 'block';
  }

  renderTroubleDots();

  // Check for mastery and launch confetti if just achieved
  const wasMastered = document.getElementById('masteryMsg') &&
                      document.getElementById('masteryMsg').style.display === 'block';
  const nowMastered = checkTroubleMastery();
  if (!wasMastered && nowMastered) {
    window.launchConfetti();
  }
};

window.nextTrouble = function nextTrouble() {
  if (troubleState.current < troubleScenarios.length - 1) {
    troubleState.current++;
    saveTroubleState();
    renderTrouble();
  }
};

window.prevTrouble = function prevTrouble() {
  if (troubleState.current > 0) {
    troubleState.current--;
    saveTroubleState();
    renderTrouble();
  }
};

window.resetTrouble = function resetTrouble() {
  troubleState = { current: 0, answers: {}, checked: {}, attempts: {}, correct: [] };
  saveTroubleState();
  const completeBtn = document.getElementById('completePart5');
  if (completeBtn) completeBtn.disabled = true;
  const masteryMsg = document.getElementById('masteryMsg');
  if (masteryMsg) masteryMsg.style.display = 'none';
  renderTrouble();
};

/* ============================================================
   7. CONFETTI EFFECT
   ============================================================ */

/**
 * Launches a simple DOM-based confetti animation.
 * Creates ~80 colorful particles that fall and fade over ~3 seconds.
 */
window.launchConfetti = function launchConfetti() {
  const colors = ['#7cc0ff', '#9cf3db', '#ffd400', '#ff6b6b', '#a8ff78', '#ff9ff3', '#54a0ff', '#feca57'];
  const count  = 80;
  const particles = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';

    const size  = 6 + Math.random() * 8;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left  = Math.random() * 100;          // vw %
    const delay = Math.random() * 1.2;           // seconds
    const dur   = 2.2 + Math.random() * 1.4;     // seconds
    const shape = Math.random() > 0.5 ? '50%' : '2px'; // circle or rect

    el.style.cssText = `
      left: ${left}vw;
      top: -20px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${shape};
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;

    document.body.appendChild(el);
    particles.push(el);
  }

  // Clean up after all animations finish (~4 seconds max)
  setTimeout(() => {
    particles.forEach(el => el.remove());
  }, 4200);
};

/* ============================================================
   8. TEACHER CHECKPOINT — Part 6
   ============================================================ */

/**
 * Checks whether all 4 self-check checkboxes are checked.
 * Enables/disables the Part 6 Mark Complete button accordingly.
 */
window.updateChecklistBtn = function updateChecklistBtn() {
  const checks = ['check1', 'check2', 'check3', 'check4'];
  const allChecked = checks.every(id => {
    const el = document.getElementById(id);
    return el && el.checked;
  });
  const btn = document.getElementById('completePart6');
  if (btn) btn.disabled = !allChecked;
};

/* ============================================================
   9. SUMMARY GENERATION — Part 7
   ============================================================ */

/**
 * Reads all student input fields and populates #summaryOutput
 * with a formatted summary ready for pasting into Google Classroom.
 */
window.generateSummary = function generateSummary() {
  const reflection    = (document.getElementById('reflection')    || {}).value || '(not entered)';
  const modelName     = (document.getElementById('modelName')     || {}).value || '(not entered)';
  const modelLink     = (document.getElementById('modelLink')     || {}).value || '(not entered)';
  const whyModel      = (document.getElementById('whyModel')      || {}).value || '(not entered)';
  const potentialIssue = (document.getElementById('potentialIssue') || {}).value || '(not entered)';

  const summary = [
    '=== Day 2: From Model to Print Setup ===',
    '',
    '📝 Reflection (Share-Out):',
    reflection,
    '',
    '🖨️ My Chosen Model:',
    'Name: ' + modelName,
    'Link: ' + modelLink,
    '',
    '✅ Why This Model:',
    whyModel,
    '',
    '⚠️ Potential Print Issue:',
    potentialIssue,
    '',
    '--- Copy and paste this into Google Classroom ---'
  ].join('\n');

  const out = document.getElementById('summaryOutput');
  if (out) out.value = summary;
};

/* ============================================================
   INIT — runs after DOM is ready (script has defer)
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  /* ── Restore theme ──────────────────────────────────────── */
  const savedTheme    = localStorage.getItem(STORAGE_THEME)    || 'auto';
  const savedFontSize = localStorage.getItem(STORAGE_FONTSIZE) || 'default';

  window.applyTheme(savedTheme);
  window.applyFontSize(savedFontSize);

  const themeSelector    = document.getElementById('themeSelector');
  const fontSizeSelector = document.getElementById('fontSizeSelector');

  if (themeSelector)    themeSelector.value    = savedTheme;
  if (fontSizeSelector) fontSizeSelector.value = savedFontSize;

  if (themeSelector) {
    themeSelector.addEventListener('change', function () {
      window.applyTheme(this.value);
    });
  }
  if (fontSizeSelector) {
    fontSizeSelector.addEventListener('change', function () {
      window.applyFontSize(this.value);
    });
  }

  // Also update theme if OS preference changes (relevant for 'auto' mode)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem(STORAGE_THEME) === 'auto') {
      window.applyTheme('auto');
    }
  });

  /* ── Restore progress ───────────────────────────────────── */
  try {
    const stored = localStorage.getItem(STORAGE_PROGRESS);
    if (stored) completedParts = JSON.parse(stored);
  } catch (_) {
    completedParts = [];
  }

  updateProgress();
  updateCardStates();

  // Open the first incomplete (active) part
  let opened = false;
  for (let n = 1; n <= TOTAL_PARTS; n++) {
    if (!completedParts.includes(n)) {
      const card = document.getElementById('part' + n);
      if (card && !card.classList.contains('locked-card')) {
        card.setAttribute('open', '');
      }
      opened = true;
      break;
    }
  }
  // If all parts are done, open the last one
  if (!opened) {
    const last = document.getElementById('part' + TOTAL_PARTS);
    if (last) last.setAttribute('open', '');
  }

  /* ── Restore quiz state ─────────────────────────────────── */
  try {
    const storedQuiz = localStorage.getItem(STORAGE_QUIZ);
    if (storedQuiz) quizState = JSON.parse(storedQuiz);
  } catch (_) {
    quizState = { current: 0, answers: {}, checked: {} };
  }
  renderQuiz();

  /* ── Restore matching state & render ────────────────────── */
  try {
    const storedMatch = localStorage.getItem(STORAGE_MATCHING);
    if (storedMatch) matchingState = JSON.parse(storedMatch);
  } catch (_) {
    matchingState = { attempts: 0, answers: {} };
  }
  renderMatching();

  // If matching was previously attempted, re-evaluate button state
  if (matchingState.attempts > 0) {
    // Silently check to restore completePart4 button state without re-saving
    let numCorrect = 0;
    matchingPairs.forEach((pair, i) => {
      if (matchingState.answers[i] === pair.correct) numCorrect++;
    });
    const completeBtn = document.getElementById('completePart4');
    if (completeBtn) completeBtn.disabled = numCorrect < 3;
  }

  /* ── Restore troubleshooting state & render ─────────────── */
  try {
    const storedTrouble = localStorage.getItem(STORAGE_TROUBLE);
    if (storedTrouble) troubleState = JSON.parse(storedTrouble);
  } catch (_) {
    troubleState = { current: 0, answers: {}, checked: {}, attempts: {}, correct: [] };
  }
  renderTrouble();

  /* ── Restore checklist state ────────────────────────────── */
  window.updateChecklistBtn();
});
