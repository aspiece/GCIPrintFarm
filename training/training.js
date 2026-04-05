/* ============================================================
   GCI 3D Printing Training – Shared JavaScript
   Used by: day1.html through day5.html
   ============================================================ */

/* ── Theme Switcher ────────────────────────────────────────── */
(function () {
    const themeSelector = document.getElementById('theme-selector');
    const themeStorageKey = 'gci-3d-printing-theme-v1';

    function applyTheme(theme) {
        // 'auto' resolves to dark or light based on OS preference
        let effectiveTheme = theme;
        if (theme === 'auto') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        const normalizedTheme = ['dark', 'light', 'high-contrast'].includes(effectiveTheme) ? effectiveTheme : 'dark';
        if (normalizedTheme === 'dark') {
            document.body.removeAttribute('data-theme');
        } else {
            document.body.setAttribute('data-theme', normalizedTheme);
        }
        if (themeSelector) {
            themeSelector.value = theme; // preserve the raw choice (including 'auto')
        }
        localStorage.setItem(themeStorageKey, theme);
        window._gciThemePref = theme; // track for OS-preference change handler
    }

    // Expose globally so Day 2 inline handlers can call it
    window.applyTheme = applyTheme;

    function restoreTheme() {
        const savedTheme = localStorage.getItem(themeStorageKey) || 'dark';
        applyTheme(savedTheme);
    }

    if (themeSelector) {
        themeSelector.addEventListener('change', function () {
            applyTheme(this.value);
        });
    }

    // Re-apply when OS dark/light preference changes (only relevant for 'auto' mode)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (window._gciThemePref === 'auto') applyTheme('auto');
    });

    restoreTheme();
})();

/* ── Font Size ─────────────────────────────────────────────── */
(function () {
    const fontSizeStorageKey = 'gci-3d-printing-fontsize-v1';
    const fontSizeSelector   = document.getElementById('fontSizeSelector');

    function applyFontSize(size) {
        if (size === 'default') {
            document.body.removeAttribute('data-font-size');
        } else {
            document.body.setAttribute('data-font-size', size);
        }
        localStorage.setItem(fontSizeStorageKey, size);
    }

    window.applyFontSize = applyFontSize;

    const savedFontSize = localStorage.getItem(fontSizeStorageKey) || 'default';
    applyFontSize(savedFontSize);
    if (fontSizeSelector) {
        fontSizeSelector.value = savedFontSize;
        fontSizeSelector.addEventListener('change', function () {
            applyFontSize(this.value);
        });
    }
})();

/* ── Quiz Renderer ─────────────────────────────────────────── */
/**
 * Renders a sequential quiz into a container element.
 * @param {string} containerId - The id of the container element.
 * @param {Array}  questions   - Array of question objects with shape:
 *   { type: 'mcq'|'multi'|'drag', prompt: string, options: string[] }
 */
function renderQuiz(containerId, questions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let current = 0;

    function showQuestion(idx) {
        const q = questions[idx];
        let html = `<div class="quiz-q"><strong>Question ${idx + 1} of ${questions.length}:</strong><br>${q.prompt}</div>`;

        if (q.type === 'mcq') {
            html += q.options.map((opt, i) =>
                `<div><label><input type="radio" name="q${containerId}" value="${i}"> ${opt}</label></div>`
            ).join('');
        } else if (q.type === 'multi') {
            html += q.options.map((opt, i) =>
                `<div><label><input type="checkbox" name="q${containerId}" value="${i}"> ${opt}</label></div>`
            ).join('');
        } else if (q.type === 'drag') {
            html += `<div style='margin:0.5em 0 1em 0;'><em>(Select all that apply.)</em></div>`;
            html += q.options.map((opt, i) =>
                `<div><label><input type="checkbox" name="q${containerId}" value="${i}"> ${opt}</label></div>`
            ).join('');
        }

        html += `<div style="margin-top:1em;">
            <button type="button" id="nextBtn${containerId}">
                ${idx < questions.length - 1 ? 'Next' : 'Finish'}
            </button>
        </div>`;

        container.innerHTML = html;

        document.getElementById(`nextBtn${containerId}`).onclick = function () {
            if (idx < questions.length - 1) {
                showQuestion(idx + 1);
            } else {
                container.innerHTML = '<div class="guidance" style="margin-top:1em;">Quiz complete! Thank you for participating.</div>';
            }
        };
    }

    showQuestion(current);
}

/* ============================================================
   DAY 2 — From Model to Print Setup
   All functions below are only activated on day2.html.
   Every handler is attached to window.* so inline onclick
   attributes work correctly with the defer attribute.
   ============================================================ */

/* ── Day 2 Storage Keys ────────────────────────────────────── */
var D2_STORAGE_PROGRESS = 'gci-day2-completed';
var D2_STORAGE_QUIZ     = 'gci-day2-quiz';
var D2_STORAGE_MATCHING = 'gci-day2-matching';
var D2_STORAGE_TROUBLE  = 'gci-day2-trouble';

var D2_TOTAL_PARTS   = 7;
var d2CompletedParts = [];

/* ── Progress ──────────────────────────────────────────────── */
function d2UpdateProgress() {
    var pct    = Math.round((d2CompletedParts.length / D2_TOTAL_PARTS) * 100);
    var fill   = document.getElementById('progressFill');
    var pctEl  = document.getElementById('progressPercent');
    var stepEl = document.getElementById('progressStep');
    var bar    = fill && fill.closest('[role="progressbar"]');

    if (fill)  fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (bar)   bar.setAttribute('aria-valuenow', pct);

    var currentStep = D2_TOTAL_PARTS;
    for (var i = 1; i <= D2_TOTAL_PARTS; i++) {
        if (!d2CompletedParts.includes(i)) { currentStep = i; break; }
    }
    if (stepEl) stepEl.textContent = 'Step ' + currentStep + ' of ' + D2_TOTAL_PARTS;
}

function d2UpdateCardStates() {
    for (var n = 1; n <= D2_TOTAL_PARTS; n++) {
        var card  = document.getElementById('part' + n);
        var badge = document.getElementById('badge' + n);
        if (!card) continue;

        var isDone   = d2CompletedParts.includes(n);
        var isLocked = n > 1 && !d2CompletedParts.includes(n - 1);

        card.classList.remove('active-card', 'completed-card', 'locked-card');
        if (isDone)        card.classList.add('completed-card');
        else if (isLocked) card.classList.add('locked-card');
        else               card.classList.add('active-card');

        if (badge) {
            badge.textContent = isDone ? 'Complete' : isLocked ? 'Locked' : 'Active';
            badge.className   = 'state-badge ' + (isDone ? 'completed' : isLocked ? 'locked' : 'active');
        }

        // Enable/disable unnamed Mark Complete buttons
        card.querySelectorAll('button[onclick*="window.complete"]').forEach(function (btn) {
            if (!btn.id) btn.disabled = isLocked;
        });

        // Locked cards cannot be opened
        if (isLocked) card.removeAttribute('open');
    }
}

/* ── Mark Complete ─────────────────────────────────────────── */
if (document.body.getAttribute('data-page') === 'day2') {
window.complete = function complete(partNum) {
    if (!d2CompletedParts.includes(partNum)) {
        d2CompletedParts.push(partNum);
        localStorage.setItem(D2_STORAGE_PROGRESS, JSON.stringify(d2CompletedParts));
    }
    var current = document.getElementById('part' + partNum);
    if (current) current.removeAttribute('open');

    var next = document.getElementById('part' + (partNum + 1));
    if (next) {
        next.setAttribute('open', '');
        setTimeout(function () { next.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    }
    d2UpdateProgress();
    d2UpdateCardStates();
};

/* ── Quiz (Part 3) ─────────────────────────────────────────── */
var d2QuizQuestions = [
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
        explanation: "Preview lets you scrub through every layer before printing -- great for spotting missing supports or unexpected gaps before wasting filament."
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

var d2QuizState = { current: 0, answers: {}, checked: {} };

function d2SaveQuizState() {
    localStorage.setItem(D2_STORAGE_QUIZ, JSON.stringify(d2QuizState));
}

function d2RenderQuiz() {
    var idx      = d2QuizState.current;
    var q        = d2QuizQuestions[idx];
    if (!q) return;

    var prog     = document.getElementById('quizProgress');
    var qText    = document.getElementById('qText');
    var qOptions = document.getElementById('qOptions');
    var fb       = document.getElementById('feedback');
    var expl     = document.getElementById('explanation');
    var next     = document.getElementById('nextBtn');

    if (prog)  prog.textContent  = 'Question ' + (idx + 1) + ' of ' + d2QuizQuestions.length;
    if (qText) qText.textContent = q.prompt;
    if (!qOptions) return;

    qOptions.innerHTML = '';
    var savedAnswer = d2QuizState.answers[idx];
    var isChecked   = !!d2QuizState.checked[idx];

    if (q.type === 'mcq') {
        q.options.forEach(function (opt, i) {
            var wrapper = document.createElement('div');
            var label   = document.createElement('label');
            var radio   = document.createElement('input');
            radio.type  = 'radio';
            radio.name  = 'd2QuizQ';
            radio.value = i;
            if (savedAnswer === i) radio.checked = true;
            if (isChecked) radio.disabled = true;
            label.appendChild(radio);
            label.appendChild(document.createTextNode(' ' + opt));
            wrapper.appendChild(label);
            qOptions.appendChild(wrapper);
        });
    } else {
        q.options.forEach(function (opt, i) {
            var wrapper = document.createElement('div');
            var label   = document.createElement('label');
            var cb      = document.createElement('input');
            cb.type     = 'checkbox';
            cb.name     = 'd2QuizQ';
            cb.value    = i;
            if (Array.isArray(savedAnswer) && savedAnswer.includes(i)) cb.checked = true;
            if (isChecked) cb.disabled = true;
            label.appendChild(cb);
            label.appendChild(document.createTextNode(' ' + opt));
            wrapper.appendChild(label);
            qOptions.appendChild(wrapper);
        });
    }

    if (fb)   { fb.textContent = ''; fb.classList.remove('correct', 'incorrect'); }
    if (expl) expl.textContent = '';

    if (isChecked) {
        var correct = d2IsAnswerCorrect(idx);
        if (fb) {
            fb.textContent = correct ? '\u2705 Correct!' : '\u274C Not quite.';
            fb.classList.add(correct ? 'correct' : 'incorrect');
        }
        if (expl) expl.textContent = q.explanation;
        if (next) next.disabled = false;
    } else {
        if (next) next.disabled = true;
    }
}

function d2IsAnswerCorrect(idx) {
    var q   = d2QuizQuestions[idx];
    var ans = d2QuizState.answers[idx];
    if (q.type === 'multi') {
        if (!Array.isArray(ans)) return false;
        return JSON.stringify([].concat(q.correct).sort()) === JSON.stringify([].concat(ans).sort());
    }
    return ans === q.correct;
}

function d2ReadSelection(idx) {
    var q = d2QuizQuestions[idx];
    if (q.type === 'mcq') {
        var sel = document.querySelector('input[name="d2QuizQ"]:checked');
        return sel ? parseInt(sel.value, 10) : null;
    }
    var checked = document.querySelectorAll('input[name="d2QuizQ"]:checked');
    return Array.from(checked).map(function (el) { return parseInt(el.value, 10); });
}

window.checkAnswer = function checkAnswer() {
    var idx = d2QuizState.current;
    var q   = d2QuizQuestions[idx];
    var sel = d2ReadSelection(idx);
    var fb  = document.getElementById('feedback');

    if (q.type === 'mcq' && sel === null) {
        if (fb) { fb.textContent = 'Please select an answer.'; fb.classList.remove('correct', 'incorrect'); }
        return;
    }
    if (q.type === 'multi' && (!Array.isArray(sel) || sel.length === 0)) {
        if (fb) { fb.textContent = 'Please select at least one answer.'; fb.classList.remove('correct', 'incorrect'); }
        return;
    }

    d2QuizState.answers[idx] = sel;
    d2QuizState.checked[idx] = true;
    d2SaveQuizState();

    var correct = d2IsAnswerCorrect(idx);
    var expl = document.getElementById('explanation');
    var next = document.getElementById('nextBtn');

    if (fb) {
        fb.textContent = correct ? '\u2705 Correct!' : '\u274C Not quite \u2014 read the explanation below.';
        fb.classList.remove('correct', 'incorrect');
        fb.classList.add(correct ? 'correct' : 'incorrect');
    }
    if (expl) expl.textContent = q.explanation;
    document.querySelectorAll('input[name="d2QuizQ"]').forEach(function (el) { el.disabled = true; });
    if (next) next.disabled = false;
};

window.nextQuestion = function nextQuestion() {
    if (d2QuizState.current < d2QuizQuestions.length - 1) {
        d2QuizState.current++;
        d2SaveQuizState();
        d2RenderQuiz();
    }
};

window.prevQuestion = function prevQuestion() {
    if (d2QuizState.current > 0) {
        d2QuizState.current--;
        d2SaveQuizState();
        d2RenderQuiz();
    }
};

window.resetQuiz = function resetQuiz() {
    d2QuizState = { current: 0, answers: {}, checked: {} };
    d2SaveQuizState();
    d2RenderQuiz();
};

/* ── Matching Activity (Part 4) ────────────────────────────── */
var d2MatchingPairs = [
    { term: "Import Model",    correct: "Drag a .STL or .3MF file into the workspace" },
    { term: "Printer Profile", correct: "Select your specific Bambu printer model and settings" },
    { term: "Slice",           correct: "Convert the 3D model into layer-by-layer print instructions" },
    { term: "Preview",         correct: "See a layer-by-layer simulation before you print" }
];

var d2MatchingState = { attempts: 0, answers: {} };

function d2Shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j   = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

function d2RenderMatching() {
    var container = document.getElementById('matchingActivity');
    if (!container) return;

    var defs = d2Shuffle(d2MatchingPairs.map(function (p) { return p.correct; }));
    var html = '<div class="match-grid">';

    d2MatchingPairs.forEach(function (pair, i) {
        var saved = d2MatchingState.answers[i] || '';
        var opts  = defs.map(function (d) {
            var sel  = d === saved ? ' selected' : '';
            var safe = d.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            return '<option value="' + safe + '"' + sel + '>' + safe + '</option>';
        }).join('');
        var safeTerm = pair.term.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        html += '<div class="match-row" id="matchRow' + i + '">' +
            '<span class="match-term">' + safeTerm + '</span>' +
            '<select id="matchSel' + i + '" aria-label="Definition for ' + safeTerm + '">' +
            '<option value="">-- Select a definition --</option>' + opts +
            '</select>' +
            '<span class="match-result" id="matchResult' + i + '" aria-hidden="true"></span>' +
            '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    var fb = document.getElementById('matchingFeedback');
    if (fb) { fb.textContent = ''; fb.classList.remove('correct', 'incorrect'); }
    var hint = document.getElementById('hintBoxMatching');
    if (hint) hint.style.display = 'none';
}

window.checkMatching = function checkMatching() {
    d2MatchingPairs.forEach(function (_, i) {
        var sel = document.getElementById('matchSel' + i);
        if (sel) d2MatchingState.answers[i] = sel.value;
    });
    d2MatchingState.attempts++;
    localStorage.setItem(D2_STORAGE_MATCHING, JSON.stringify(d2MatchingState));

    var numCorrect = 0;
    d2MatchingPairs.forEach(function (pair, i) {
        var resultEl  = document.getElementById('matchResult' + i);
        var isCorrect = d2MatchingState.answers[i] === pair.correct;
        if (isCorrect) numCorrect++;
        if (resultEl) resultEl.textContent = isCorrect ? '\u2713' : '\u2717';
    });

    var fb = document.getElementById('matchingFeedback');
    if (fb) {
        fb.textContent = numCorrect + ' of 4 correct.';
        fb.classList.remove('correct', 'incorrect');
        fb.classList.add(numCorrect >= 3 ? 'correct' : 'incorrect');
    }

    var completeBtn = document.getElementById('completePart4');
    if (completeBtn) completeBtn.disabled = numCorrect < 3;

    var hint = document.getElementById('hintBoxMatching');
    if (hint && d2MatchingState.attempts >= 2 && numCorrect < 4) hint.style.display = 'block';
};

window.resetMatching = function resetMatching() {
    d2MatchingState = { attempts: 0, answers: {} };
    localStorage.removeItem(D2_STORAGE_MATCHING);
    var completeBtn = document.getElementById('completePart4');
    if (completeBtn) completeBtn.disabled = true;
    d2RenderMatching();
};

/* ── Troubleshooting Activity (Part 5) ─────────────────────── */
var d2TroubleScenarios = [
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
        explanation: "Overhangs beyond about 45\u00b0 need supports. Without them, the filament is extruded into mid-air and sags.",
        hint: "Filament needs something to rest on. What does Bambu Studio let you add for overhanging sections?"
    },
    {
        scenario: "You printed a model with very fine details \u2014 tiny text and thin ridges. After printing, the details are blobby and hard to see.",
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

var d2TroubleState = { current: 0, answers: {}, checked: {}, attempts: {}, correct: [] };

function d2SaveTroubleState() {
    localStorage.setItem(D2_STORAGE_TROUBLE, JSON.stringify(d2TroubleState));
}

function d2RenderTroubleDots() {
    var dots = document.getElementById('troubleDots');
    if (!dots) return;
    dots.innerHTML = d2TroubleScenarios.map(function (_, i) {
        var cls      = 'progress-dot';
        var answered = d2TroubleState.checked[i] && d2TroubleState.answers[i] === d2TroubleScenarios[i].correct;
        if (answered)                          cls += ' done';
        else if (i === d2TroubleState.current) cls += ' current';
        return '<span class="' + cls + '" aria-hidden="true"></span>';
    }).join('');
}

function d2CheckTroubleMastery() {
    var correctCount = 0;
    d2TroubleScenarios.forEach(function (s, i) {
        if (d2TroubleState.checked[i] && d2TroubleState.answers[i] === s.correct) correctCount++;
    });
    var mastery     = correctCount >= 3;
    var masteryMsg  = document.getElementById('masteryMsg');
    var completeBtn = document.getElementById('completePart5');
    if (masteryMsg)  masteryMsg.style.display = mastery ? 'block' : 'none';
    if (completeBtn) completeBtn.disabled     = !mastery;
    return mastery;
}

function d2RenderTrouble() {
    var idx = d2TroubleState.current;
    var s   = d2TroubleScenarios[idx];
    if (!s) return;

    var prog     = document.getElementById('troubleProgress');
    var scenario = document.getElementById('troubleScenario');
    var opts     = document.getElementById('troubleOptions');
    var fb       = document.getElementById('troubleFeedback');
    var expl     = document.getElementById('troubleExplanation');
    var hint     = document.getElementById('hintBoxTrouble');
    var next     = document.getElementById('troubleNextBtn');

    if (prog)     prog.textContent     = 'Scenario ' + (idx + 1) + ' of ' + d2TroubleScenarios.length;
    if (scenario) scenario.textContent = '\u201c' + s.scenario + '\u201d';

    if (opts) {
        var savedAns  = d2TroubleState.answers[idx];
        var isChecked = !!d2TroubleState.checked[idx];
        opts.innerHTML = s.options.map(function (opt, i) {
            var chk = savedAns === i ? ' checked' : '';
            var dis = isChecked    ? ' disabled' : '';
            return '<div><label><input type="radio" name="d2TroubleQ" value="' + i + '"' + chk + dis + '> ' + opt + '</label></div>';
        }).join('');
    }

    if (fb)   { fb.textContent = ''; fb.classList.remove('correct', 'incorrect'); }
    if (expl) expl.textContent = '';
    if (hint) { hint.style.display = 'none'; hint.textContent = ''; }
    if (next) next.disabled = true;

    if (d2TroubleState.checked[idx]) {
        var correct = d2TroubleState.answers[idx] === s.correct;
        if (fb) {
            fb.textContent = correct ? '\u2705 Correct!' : '\u274C Not quite \u2014 read the explanation below.';
            fb.classList.add(correct ? 'correct' : 'incorrect');
        }
        if (expl) expl.textContent = s.explanation;
        if (next) next.disabled = false;
        var attempts = d2TroubleState.attempts[idx] || 0;
        if (!correct && attempts >= 2 && hint) {
            hint.textContent = '\uD83D\uDCA1 Hint: ' + s.hint;
            hint.style.display = 'block';
        }
    }

    d2RenderTroubleDots();
    d2CheckTroubleMastery();
}

window.checkTrouble = function checkTrouble() {
    var idx = d2TroubleState.current;
    var s   = d2TroubleScenarios[idx];
    var sel = document.querySelector('input[name="d2TroubleQ"]:checked');
    var fb  = document.getElementById('troubleFeedback');

    if (!sel) {
        if (fb) { fb.textContent = 'Please select an answer.'; fb.classList.remove('correct', 'incorrect'); }
        return;
    }

    var answer = parseInt(sel.value, 10);
    d2TroubleState.answers[idx]  = answer;
    d2TroubleState.checked[idx]  = true;
    d2TroubleState.attempts[idx] = (d2TroubleState.attempts[idx] || 0) + 1;
    if (answer === s.correct && !d2TroubleState.correct.includes(idx)) {
        d2TroubleState.correct.push(idx);
    }
    d2SaveTroubleState();

    var correct = answer === s.correct;
    var expl = document.getElementById('troubleExplanation');
    var hint = document.getElementById('hintBoxTrouble');
    var next = document.getElementById('troubleNextBtn');

    if (fb) {
        fb.textContent = correct ? '\u2705 Correct!' : '\u274C Not quite \u2014 read the explanation below.';
        fb.classList.remove('correct', 'incorrect');
        fb.classList.add(correct ? 'correct' : 'incorrect');
    }
    if (expl) expl.textContent = s.explanation;
    if (next) next.disabled = false;
    document.querySelectorAll('input[name="d2TroubleQ"]').forEach(function (el) { el.disabled = true; });

    if (!correct && d2TroubleState.attempts[idx] >= 2 && hint) {
        hint.textContent = '\uD83D\uDCA1 Hint: ' + s.hint;
        hint.style.display = 'block';
    }

    d2RenderTroubleDots();

    // Launch confetti on mastery (only the first time mastery is achieved)
    var masteryMsg  = document.getElementById('masteryMsg');
    var wasShowing  = masteryMsg && masteryMsg.style.display === 'block';
    var nowMastered = d2CheckTroubleMastery();
    if (!wasShowing && nowMastered) window.launchConfetti();
};

window.nextTrouble = function nextTrouble() {
    if (d2TroubleState.current < d2TroubleScenarios.length - 1) {
        d2TroubleState.current++;
        d2SaveTroubleState();
        d2RenderTrouble();
    }
};

window.prevTrouble = function prevTrouble() {
    if (d2TroubleState.current > 0) {
        d2TroubleState.current--;
        d2SaveTroubleState();
        d2RenderTrouble();
    }
};

window.resetTrouble = function resetTrouble() {
    d2TroubleState = { current: 0, answers: {}, checked: {}, attempts: {}, correct: [] };
    d2SaveTroubleState();
    var completeBtn = document.getElementById('completePart5');
    if (completeBtn) completeBtn.disabled = true;
    var masteryMsg = document.getElementById('masteryMsg');
    if (masteryMsg) masteryMsg.style.display = 'none';
    d2RenderTrouble();
};

/* ── Confetti Effect ───────────────────────────────────────── */
window.launchConfetti = function launchConfetti() {
    var colors    = ['#7cc0ff', '#9cf3db', '#ffd400', '#ff6b6b', '#a8ff78', '#ff9ff3', '#54a0ff', '#feca57'];
    var count     = 80;
    var particles = [];

    for (var i = 0; i < count; i++) {
        var el    = document.createElement('div');
        el.className = 'confetti-particle';
        var size  = 6 + Math.random() * 8;
        var color = colors[Math.floor(Math.random() * colors.length)];
        var left  = Math.random() * 100;
        var delay = Math.random() * 1.2;
        var dur   = 2.2 + Math.random() * 1.4;
        var shape = Math.random() > 0.5 ? '50%' : '2px';
        el.style.cssText = [
            'position:fixed', 'pointer-events:none', 'z-index:9999',
            'left:' + left + 'vw', 'top:-20px',
            'width:' + size + 'px', 'height:' + size + 'px',
            'background:' + color,
            'border-radius:' + shape,
            'animation:confettiFall ' + dur + 's ' + delay + 's linear forwards'
        ].join(';');
        document.body.appendChild(el);
        particles.push(el);
    }
    setTimeout(function () { particles.forEach(function (el) { el.remove(); }); }, 4500);
};

/* ── Teacher Checkpoint (Part 6) ───────────────────────────── */
window.updateChecklistBtn = function updateChecklistBtn() {
    var ids = ['check1', 'check2', 'check3', 'check4'];
    var allChecked = ids.every(function (id) {
        var el = document.getElementById(id);
        return el && el.checked;
    });
    var btn = document.getElementById('completePart6');
    if (btn) btn.disabled = !allChecked;
};

/* ── Summary Generation (Part 7) ───────────────────────────── */
window.generateSummary = function generateSummary() {
    function val(id) {
        var el = document.getElementById(id);
        return (el && el.value.trim()) || '(not entered)';
    }
    var lines = [
        '=== Day 2: From Model to Print Setup ===',
        '',
        '\uD83D\uDCDD Reflection (Share-Out):',
        val('reflection'),
        '',
        '\uD83D\uDDA8\uFE0F My Chosen Model:',
        'Name: ' + val('modelName'),
        'Link: ' + val('modelLink'),
        '',
        '\u2705 Why This Model:',
        val('whyModel'),
        '',
        '\u26A0\uFE0F Potential Print Issue:',
        val('potentialIssue'),
        '',
        '--- Copy and paste this into Google Classroom ---'
    ];
    var out = document.getElementById('summaryOutput');
    if (out) out.value = lines.join('\n');
};
} // end day2 guard

/* ── Day 2 Initialisation (DOMContentLoaded) ───────────────── */
document.addEventListener('DOMContentLoaded', function () {
    // Guard: only run on day2.html (body must carry data-page="day2")
    if (document.body.getAttribute('data-page') !== 'day2') return;

    /* Restore progress from localStorage */
    try {
        var stored = localStorage.getItem(D2_STORAGE_PROGRESS);
        if (stored) d2CompletedParts = JSON.parse(stored);
    } catch (e) { console.warn('Day 2: failed to restore progress:', e); d2CompletedParts = []; }

    d2UpdateProgress();
    d2UpdateCardStates();

    // Open the first incomplete, unlocked part
    var opened = false;
    for (var n = 1; n <= D2_TOTAL_PARTS; n++) {
        if (!d2CompletedParts.includes(n)) {
            var card = document.getElementById('part' + n);
            if (card && !card.classList.contains('locked-card')) {
                card.setAttribute('open', '');
            }
            opened = true;
            break;
        }
    }
    if (!opened) {
        var last = document.getElementById('part' + D2_TOTAL_PARTS);
        if (last) last.setAttribute('open', '');
    }

    /* Restore and render the Part 3 quiz */
    try {
        var storedQuiz = localStorage.getItem(D2_STORAGE_QUIZ);
        if (storedQuiz) d2QuizState = JSON.parse(storedQuiz);
    } catch (e) { console.warn('Day 2: failed to restore quiz state:', e); d2QuizState = { current: 0, answers: {}, checked: {} }; }
    d2RenderQuiz();

    /* Restore and render the Part 4 matching activity */
    try {
        var storedMatch = localStorage.getItem(D2_STORAGE_MATCHING);
        if (storedMatch) d2MatchingState = JSON.parse(storedMatch);
    } catch (e) { console.warn('Day 2: failed to restore matching state:', e); d2MatchingState = { attempts: 0, answers: {} }; }
    d2RenderMatching();

    // Restore Part 4 complete-button state after previous attempts
    if (d2MatchingState.attempts > 0) {
        var numCorrect = 0;
        d2MatchingPairs.forEach(function (pair, i) {
            if (d2MatchingState.answers[i] === pair.correct) numCorrect++;
        });
        var btn4 = document.getElementById('completePart4');
        if (btn4) btn4.disabled = numCorrect < 3;
    }

    /* Restore and render the Part 5 troubleshooting activity */
    try {
        var storedTrouble = localStorage.getItem(D2_STORAGE_TROUBLE);
        if (storedTrouble) d2TroubleState = JSON.parse(storedTrouble);
    } catch (e) { console.warn('Day 2: failed to restore troubleshooting state:', e); d2TroubleState = { current: 0, answers: {}, checked: {}, attempts: {}, correct: [] }; }
    d2RenderTrouble();

    /* Restore Part 6 checklist button state */
    window.updateChecklistBtn();
});

/* ============================================================
   DAY 3 — Designing for 3D Printing: File Types and Tinkercad
   All functions below are only activated on day3.html.
   Every handler is attached to window.* so inline onclick
   attributes work correctly with the defer attribute.
   ============================================================ */

/* ── Day 3 Storage Keys ────────────────────────────────────── */
var D3_STORAGE_PROGRESS = 'gci-day3-completed';
var D3_STORAGE_QUIZ     = 'gci-day3-quiz';
var D3_STORAGE_WORKFLOW = 'gci-day3-workflow';

var D3_TOTAL_PARTS   = 7;
var d3CompletedParts = [];

/* ── Progress ──────────────────────────────────────────────── */
function d3UpdateProgress() {
    var pct    = Math.round((d3CompletedParts.length / D3_TOTAL_PARTS) * 100);
    var fill   = document.getElementById('progressFill');
    var pctEl  = document.getElementById('progressPercent');
    var stepEl = document.getElementById('progressStep');
    var bar    = fill && fill.closest('[role="progressbar"]');

    if (fill)  fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (bar)   bar.setAttribute('aria-valuenow', pct);

    var currentStep = D3_TOTAL_PARTS;
    for (var i = 1; i <= D3_TOTAL_PARTS; i++) {
        if (!d3CompletedParts.includes(i)) { currentStep = i; break; }
    }
    if (stepEl) stepEl.textContent = 'Step ' + currentStep + ' of ' + D3_TOTAL_PARTS;
}

function d3UpdateCardStates() {
    for (var n = 1; n <= D3_TOTAL_PARTS; n++) {
        var card  = document.getElementById('part' + n);
        var badge = document.getElementById('badge' + n);
        if (!card) continue;

        var isDone   = d3CompletedParts.includes(n);
        var isLocked = n > 1 && !d3CompletedParts.includes(n - 1);

        card.classList.remove('active-card', 'completed-card', 'locked-card');
        if (isDone)        card.classList.add('completed-card');
        else if (isLocked) card.classList.add('locked-card');
        else               card.classList.add('active-card');

        if (badge) {
            badge.textContent = isDone ? 'Complete' : isLocked ? 'Locked' : 'Active';
            badge.className   = 'state-badge ' + (isDone ? 'completed' : isLocked ? 'locked' : 'active');
        }

        card.querySelectorAll('button[onclick*="window.complete"]').forEach(function (btn) {
            if (!btn.id) btn.disabled = isLocked;
        });

        if (isLocked) card.removeAttribute('open');
    }
}

if (document.body.getAttribute('data-page') === 'day3') {

/* ── Mark Complete ─────────────────────────────────────────── */
window.complete = function complete(partNum) {
    if (!d3CompletedParts.includes(partNum)) {
        d3CompletedParts.push(partNum);
        localStorage.setItem(D3_STORAGE_PROGRESS, JSON.stringify(d3CompletedParts));
    }
    var current = document.getElementById('part' + partNum);
    if (current) current.removeAttribute('open');

    var next = document.getElementById('part' + (partNum + 1));
    if (next) {
        next.setAttribute('open', '');
        setTimeout(function () { next.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    }
    d3UpdateProgress();
    d3UpdateCardStates();
};

/* ── Part 1: File Types Quiz ───────────────────────────────── */
var d3QuizQuestions = [
    {
        prompt: "What does an STL file store?",
        type: "mcq",
        options: [
            "The shape of a 3D object as a mesh of triangles",
            "The printer's speed and temperature settings",
            "Color, materials, and print settings",
            "Layer-by-layer movement instructions for the printer"
        ],
        correct: 0,
        explanation: "STL files store only the geometry (shape) of a 3D model using triangles. They do not include color, materials, or print settings — just the shape."
    },
    {
        prompt: "Which file format can store shape, color, materials, and print settings all in one file?",
        type: "mcq",
        options: [
            "STL",
            "G-code",
            "3MF",
            "PNG"
        ],
        correct: 2,
        explanation: "3MF is a newer, smarter format. It stores shape plus color, materials, orientation, and print settings — making it ideal for saving complete Bambu Studio projects."
    },
    {
        prompt: "What is G-code and who creates it?",
        type: "mcq",
        options: [
            "A design file created by Tinkercad",
            "A machine instruction file created by the slicer (Bambu Studio)",
            "A color profile created by the printer",
            "A backup file created by MakerWorld"
        ],
        correct: 1,
        explanation: "G-code is the machine language that drives the printer. The slicer (Bambu Studio) creates it when you slice your model. It tells the printer exactly where to move, when to heat up, and how fast to go."
    }
];

var d3QuizState = { current: 0, answers: {}, checked: {} };

function d3SaveQuizState() {
    localStorage.setItem(D3_STORAGE_QUIZ, JSON.stringify(d3QuizState));
}

function d3RenderQuiz() {
    var idx      = d3QuizState.current;
    var q        = d3QuizQuestions[idx];
    if (!q) return;

    var prog     = document.getElementById('d3QuizProgress');
    var qText    = document.getElementById('d3QText');
    var qOptions = document.getElementById('d3QOptions');
    var fb       = document.getElementById('d3Feedback');
    var expl     = document.getElementById('d3Explanation');
    var next     = document.getElementById('d3NextBtn');

    if (prog)  prog.textContent  = 'Question ' + (idx + 1) + ' of ' + d3QuizQuestions.length;
    if (qText) qText.textContent = q.prompt;
    if (!qOptions) return;

    qOptions.innerHTML = '';
    var savedAnswer = d3QuizState.answers[idx];
    var isChecked   = !!d3QuizState.checked[idx];

    q.options.forEach(function (opt, i) {
        var wrapper = document.createElement('div');
        var label   = document.createElement('label');
        var radio   = document.createElement('input');
        radio.type  = 'radio';
        radio.name  = 'd3QuizQ';
        radio.value = i;
        if (savedAnswer === i) radio.checked = true;
        if (isChecked) radio.disabled = true;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(' ' + opt));
        wrapper.appendChild(label);
        qOptions.appendChild(wrapper);
    });

    if (fb)   { fb.textContent = ''; fb.classList.remove('correct', 'incorrect'); }
    if (expl) expl.textContent = '';

    if (isChecked) {
        var correct = d3QuizState.answers[idx] === q.correct;
        if (fb) {
            fb.textContent = correct ? '\u2705 Correct!' : '\u274C Not quite \u2014 read the explanation below.';
            fb.classList.add(correct ? 'correct' : 'incorrect');
        }
        if (expl) expl.textContent = q.explanation;
        if (next) next.disabled = false;
    } else {
        if (next) next.disabled = true;
    }
}

window.d3CheckAnswer = function d3CheckAnswer() {
    var idx = d3QuizState.current;
    var q   = d3QuizQuestions[idx];
    var sel = document.querySelector('input[name="d3QuizQ"]:checked');
    var fb  = document.getElementById('d3Feedback');

    if (!sel) {
        if (fb) { fb.textContent = 'Please select an answer.'; fb.classList.remove('correct', 'incorrect'); }
        return;
    }

    var answer = parseInt(sel.value, 10);
    d3QuizState.answers[idx] = answer;
    d3QuizState.checked[idx] = true;
    d3SaveQuizState();

    var correct = answer === q.correct;
    var expl = document.getElementById('d3Explanation');
    var next = document.getElementById('d3NextBtn');

    if (fb) {
        fb.textContent = correct ? '\u2705 Correct!' : '\u274C Not quite \u2014 read the explanation below.';
        fb.classList.remove('correct', 'incorrect');
        fb.classList.add(correct ? 'correct' : 'incorrect');
    }
    if (expl) expl.textContent = q.explanation;
    document.querySelectorAll('input[name="d3QuizQ"]').forEach(function (el) { el.disabled = true; });
    if (next) next.disabled = false;
};

window.d3NextQuestion = function d3NextQuestion() {
    if (d3QuizState.current < d3QuizQuestions.length - 1) {
        d3QuizState.current++;
        d3SaveQuizState();
        d3RenderQuiz();
    }
};

window.d3PrevQuestion = function d3PrevQuestion() {
    if (d3QuizState.current > 0) {
        d3QuizState.current--;
        d3SaveQuizState();
        d3RenderQuiz();
    }
};

window.d3ResetQuiz = function d3ResetQuiz() {
    d3QuizState = { current: 0, answers: {}, checked: {} };
    d3SaveQuizState();
    d3RenderQuiz();
};

/* ── Part 2: Workflow Matching ─────────────────────────────── */
var d3WorkflowPairs = [
    { term: "Design",  correct: "Create your 3D model in Tinkercad" },
    { term: "Export",  correct: "Save your file as STL or 3MF from Tinkercad" },
    { term: "Slice",   correct: "Import your file into Bambu Studio and generate print instructions" },
    { term: "Print",   correct: "Send the G-code to the 3D printer and start the print" }
];

var d3WorkflowState = { attempts: 0, answers: {} };

function d3Shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j   = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

function d3RenderMatching() {
    var container = document.getElementById('d3MatchingActivity');
    if (!container) return;

    var defs = d3Shuffle(d3WorkflowPairs.map(function (p) { return p.correct; }));
    var html = '<div class="match-grid">';

    d3WorkflowPairs.forEach(function (pair, i) {
        var saved = d3WorkflowState.answers[i] || '';
        var opts  = defs.map(function (d) {
            var sel  = d === saved ? ' selected' : '';
            var safe = d.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            return '<option value="' + safe + '"' + sel + '>' + safe + '</option>';
        }).join('');
        var safeTerm = pair.term.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        html += '<div class="match-row" id="d3MatchRow' + i + '">' +
            '<span class="match-term">' + safeTerm + '</span>' +
            '<select id="d3MatchSel' + i + '" aria-label="Description for ' + safeTerm + '">' +
            '<option value="">-- Select a description --</option>' + opts +
            '</select>' +
            '<span class="match-result" id="d3MatchResult' + i + '" aria-hidden="true"></span>' +
            '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    var fb = document.getElementById('d3MatchingFeedback');
    if (fb) { fb.textContent = ''; fb.classList.remove('correct', 'incorrect'); }
    var hint = document.getElementById('d3HintBoxMatching');
    if (hint) hint.style.display = 'none';
}

window.d3CheckMatching = function d3CheckMatching() {
    d3WorkflowPairs.forEach(function (_, i) {
        var sel = document.getElementById('d3MatchSel' + i);
        if (sel) d3WorkflowState.answers[i] = sel.value;
    });
    d3WorkflowState.attempts++;
    localStorage.setItem(D3_STORAGE_WORKFLOW, JSON.stringify(d3WorkflowState));

    var numCorrect = 0;
    d3WorkflowPairs.forEach(function (pair, i) {
        var resultEl  = document.getElementById('d3MatchResult' + i);
        var isCorrect = d3WorkflowState.answers[i] === pair.correct;
        if (isCorrect) numCorrect++;
        if (resultEl) resultEl.textContent = isCorrect ? '\u2713' : '\u2717';
    });

    var fb = document.getElementById('d3MatchingFeedback');
    if (fb) {
        fb.textContent = numCorrect + ' of 4 correct.';
        fb.classList.remove('correct', 'incorrect');
        fb.classList.add(numCorrect >= 3 ? 'correct' : 'incorrect');
    }

    var completeBtn = document.getElementById('completePart2');
    if (completeBtn) completeBtn.disabled = numCorrect < 3;

    var hint = document.getElementById('d3HintBoxMatching');
    if (hint && d3WorkflowState.attempts >= 2 && numCorrect < 4) hint.style.display = 'block';
};

window.d3ResetMatching = function d3ResetMatching() {
    d3WorkflowState = { attempts: 0, answers: {} };
    localStorage.removeItem(D3_STORAGE_WORKFLOW);
    var completeBtn = document.getElementById('completePart2');
    if (completeBtn) completeBtn.disabled = true;
    d3RenderMatching();
};

/* ── Part 3: Tinkercad Checklist ───────────────────────────── */
window.d3UpdateTinkercadBtn = function d3UpdateTinkercadBtn() {
    var ids = ['d3TinkCheck1', 'd3TinkCheck2', 'd3TinkCheck3'];
    var allChecked = ids.every(function (id) {
        var el = document.getElementById(id);
        return el && el.checked;
    });
    var btn = document.getElementById('completePart3');
    if (btn) btn.disabled = !allChecked;
};

/* ── Part 4: Design Checklist ──────────────────────────────── */
window.d3UpdateDesignBtn = function d3UpdateDesignBtn() {
    var ids = ['d3DesignCheck1', 'd3DesignCheck2', 'd3DesignCheck3', 'd3DesignCheck4', 'd3DesignCheck5', 'd3DesignCheck6'];
    var allChecked = ids.every(function (id) {
        var el = document.getElementById(id);
        return el && el.checked;
    });
    var btn = document.getElementById('completePart4');
    if (btn) btn.disabled = !allChecked;
};

/* ── Part 5: Export Checklist ──────────────────────────────── */
window.d3UpdateExportBtn = function d3UpdateExportBtn() {
    var ids = ['d3ExportCheck1', 'd3ExportCheck2', 'd3ExportCheck3', 'd3ExportCheck4'];
    var allChecked = ids.every(function (id) {
        var el = document.getElementById(id);
        return el && el.checked;
    });
    var btn = document.getElementById('completePart5');
    if (btn) btn.disabled = !allChecked;
};

/* ── Part 7: Summary Generation ────────────────────────────── */
window.d3GenerateSummary = function d3GenerateSummary() {
    function val(id) {
        var el = document.getElementById(id);
        return (el && el.value.trim()) || '(not entered)';
    }
    var lines = [
        '=== Day 3: Designing for 3D Printing \u2014 File Types and Tinkercad ===',
        '',
        '\uD83C\uDFF7\uFE0F My Design Name:',
        val('d3DesignName'),
        '',
        '\uD83D\uDCDD Design Notes:',
        val('d3DesignNotes'),
        '',
        '\u2714\uFE0F Exit Ticket',
        '',
        '1. What is the difference between STL and G-code?',
        val('d3Exit1'),
        '',
        '2. What did you create in Tinkercad today?',
        val('d3Exit2'),
        '',
        '3. What part of the process still feels confusing?',
        val('d3Exit3'),
        '',
        '--- Copy and paste this into Google Classroom ---'
    ];
    var out = document.getElementById('d3SummaryOutput');
    if (out) out.value = lines.join('\n');
};

} // end day3 guard

/* ── Day 3 Initialisation (DOMContentLoaded) ───────────────── */
document.addEventListener('DOMContentLoaded', function () {
    if (document.body.getAttribute('data-page') !== 'day3') return;

    /* Restore progress from localStorage */
    try {
        var stored = localStorage.getItem(D3_STORAGE_PROGRESS);
        if (stored) d3CompletedParts = JSON.parse(stored);
    } catch (e) { console.warn('Day 3: failed to restore progress:', e); d3CompletedParts = []; }

    d3UpdateProgress();
    d3UpdateCardStates();

    /* Open the first incomplete, unlocked part */
    var opened = false;
    for (var n = 1; n <= D3_TOTAL_PARTS; n++) {
        if (!d3CompletedParts.includes(n)) {
            var card = document.getElementById('part' + n);
            if (card && !card.classList.contains('locked-card')) {
                card.setAttribute('open', '');
            }
            opened = true;
            break;
        }
    }
    if (!opened) {
        var last = document.getElementById('part' + D3_TOTAL_PARTS);
        if (last) last.setAttribute('open', '');
    }

    /* Restore and render the Part 1 quiz */
    try {
        var storedQuiz = localStorage.getItem(D3_STORAGE_QUIZ);
        if (storedQuiz) d3QuizState = JSON.parse(storedQuiz);
    } catch (e) { console.warn('Day 3: failed to restore quiz state:', e); d3QuizState = { current: 0, answers: {}, checked: {} }; }
    d3RenderQuiz();

    /* Restore and render the Part 2 matching activity */
    try {
        var storedWorkflow = localStorage.getItem(D3_STORAGE_WORKFLOW);
        if (storedWorkflow) d3WorkflowState = JSON.parse(storedWorkflow);
    } catch (e) { console.warn('Day 3: failed to restore workflow state:', e); d3WorkflowState = { attempts: 0, answers: {} }; }
    d3RenderMatching();

    /* Restore Part 2 complete-button state after previous attempts */
    if (d3WorkflowState.attempts > 0) {
        var numCorrect = 0;
        d3WorkflowPairs.forEach(function (pair, i) {
            if (d3WorkflowState.answers[i] === pair.correct) numCorrect++;
        });
        var btn2 = document.getElementById('completePart2');
        if (btn2) btn2.disabled = numCorrect < 3;
    }

    /* Restore checklist button states */
    window.d3UpdateTinkercadBtn();
    window.d3UpdateDesignBtn();
    window.d3UpdateExportBtn();
});

/* ============================================================
   DAY 1 — Foundations of 3D Printing
   All functions below are only activated on day1.html.
   Every handler is attached to window.* so inline onclick
   attributes work correctly with the defer attribute.
   ============================================================ */

/* ── Day 1 Storage Key ─────────────────────────────────────── */
var D1_STORAGE_KEY = 'gci-3d-day1-state-v1';

var D1_TOTAL_PARTS = 6;

/* ── Day 1 State ───────────────────────────────────────────── */
var d1State = {
    completedParts: [],
    texts: {},
    checks: {},
    quiz1: { current: 0, passed: [] },
    quiz4: { current: 0, passed: [] },
    matchingAttempts: 0,
    matchingScore: 0,
    troubleshootingScore: 0,
    troubleshooting: { attempts: 0 }
};

function d1SaveState() {
    localStorage.setItem(D1_STORAGE_KEY, JSON.stringify(d1State));
}

function d1LoadState() {
    var raw = localStorage.getItem(D1_STORAGE_KEY);
    if (!raw) return;
    try {
        var parsed = JSON.parse(raw);
        Object.assign(d1State, parsed);
    } catch (e) {
        console.warn('Day 1: could not load saved progress.', e);
    }
}

/* ── Progress ──────────────────────────────────────────────── */
function d1UpdateProgress() {
    var total  = D1_TOTAL_PARTS;
    var score  = d1State.completedParts.length;

    var matchingBonus      = (d1State.matchingScore || 0) / 4;
    var troubleshootingBonus = Math.min(d1State.troubleshootingScore || 0, 4) / 4;
    var weighted = score + (matchingBonus * 0.5) + (troubleshootingBonus * 0.5);

    var percent = Math.round((weighted / total) * 100);
    var fill    = document.getElementById('progressFill');
    var pctEl   = document.getElementById('progressPercent');
    var stepEl  = document.getElementById('progressStep');
    var bar     = fill && fill.closest('[role="progressbar"]');

    if (fill)  fill.style.width = percent + '%';
    if (pctEl) pctEl.textContent = percent + '%';
    if (bar)   bar.setAttribute('aria-valuenow', percent);

    var currentStep = total;
    for (var i = 1; i <= total; i++) {
        if (!d1State.completedParts.includes(i)) { currentStep = i; break; }
    }
    if (stepEl) stepEl.textContent = 'Step ' + currentStep + ' of ' + total;
}

function d1UpdateCardStates() {
    for (var n = 1; n <= D1_TOTAL_PARTS; n++) {
        var card  = document.getElementById('part' + n);
        var badge = document.getElementById('badge' + n);
        if (!card) continue;

        var isDone   = d1State.completedParts.includes(n);
        var isLocked = n > 1 && !d1State.completedParts.includes(n - 1);

        card.classList.remove('active-card', 'completed-card', 'locked-card');
        if (isDone)        card.classList.add('completed-card');
        else if (isLocked) card.classList.add('locked-card');
        else               card.classList.add('active-card');

        if (badge) {
            badge.textContent = isDone ? 'Complete' : isLocked ? 'Locked' : 'Active';
            badge.className   = 'state-badge ' + (isDone ? 'completed' : isLocked ? 'locked' : 'active');
        }

        if (isLocked) card.removeAttribute('open');
    }
}

if (document.body.getAttribute('data-page') === 'day1') {

/* ── Mark Complete ─────────────────────────────────────────── */
window.complete = function complete(partNum) {
    if (!d1State.completedParts.includes(partNum)) {
        d1State.completedParts.push(partNum);
    }
    d1UpdateProgress();
    d1UpdateCardStates();
    d1SaveState();

    var current = document.getElementById('part' + partNum);
    var next    = document.getElementById('part' + (partNum + 1));
    if (current) current.removeAttribute('open');
    if (next) {
        next.setAttribute('open', '');
        setTimeout(function () { next.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    }
};

/* ── Part 1: Intro Quiz ────────────────────────────────────── */
var d1Questions = [
    {
        q: 'What does a 3D printer do?',
        options: ['Cuts material away from a solid block', 'Builds an object layer by layer', 'Only prints on paper', 'Paints the outside of an object'],
        answer: 1,
        multi: false,
        explanation: 'The video explains that 3D printers make objects by adding material layer by layer.'
    },
    {
        q: 'Which items are needed for a basic 3D print? (Select all)',
        options: ['Filament', 'A digital 3D model', 'Slicer software', 'Gasoline'],
        answer: [0, 1, 2],
        multi: true,
        explanation: 'You need material, a model, and software to prepare the model for printing.'
    },
    {
        q: 'What happens to a model before printing starts?',
        options: ['It gets sliced into layers', 'It gets folded into shape', 'It gets painted by the printer', 'It turns into a photo'],
        answer: 0,
        multi: false,
        explanation: 'The model is sliced into layers so the printer knows how to build it.'
    },
    {
        q: 'What part melts and places the filament?',
        options: ['The screen', 'The frame', 'The nozzle', 'The spool holder'],
        answer: 2,
        multi: false,
        explanation: 'The nozzle heats the filament and places it during printing.'
    },
    {
        q: 'Why is it helpful to preview a print?',
        options: ['To catch mistakes before printing', 'To make the printer louder', 'To skip slicing', 'To change the model color automatically'],
        answer: 0,
        multi: false,
        explanation: 'Previewing helps you catch errors before wasting time and filament.'
    }
];

var d1Current    = 0;
var d1Selections = [];
var d1Locked     = false;

function d1RenderQuestion() {
    var q = d1Questions[d1Current];
    d1State.quiz1.current = d1Current;

    var prog    = document.getElementById('quizProgress');
    var qText   = document.getElementById('qText');
    var qOpts   = document.getElementById('qOptions');
    var fb      = document.getElementById('feedback');
    var expl    = document.getElementById('explanation');
    var nextBtn = document.getElementById('nextBtn');

    if (prog)  prog.textContent  = 'Question ' + (d1Current + 1) + ' of ' + d1Questions.length;
    if (qText) qText.textContent = q.q;
    if (!qOpts) return;

    var html = '';
    q.options.forEach(function (opt, i) {
        var checked = d1Selections.includes(i) ? 'checked' : '';
        if (q.multi) {
            html += '<label><input type="checkbox" ' + checked + ' onchange="window.d1SelectMulti(' + i + ')"> ' + opt + '</label>';
        } else {
            html += '<label><input type="radio" name="d1q" ' + checked + ' onchange="window.d1SelectSingle(' + i + ')"> ' + opt + '</label>';
        }
    });
    qOpts.innerHTML = html;

    if (fb)   fb.textContent = '';
    if (expl) expl.textContent = '';
    if (nextBtn) nextBtn.disabled = !d1State.quiz1.passed.includes(d1Current);
    d1Locked = d1State.quiz1.passed.includes(d1Current);
    d1SaveState();
}

window.d1SelectSingle = function d1SelectSingle(i) { if (!d1Locked) d1Selections = [i]; };
window.d1SelectMulti  = function d1SelectMulti(i) {
    if (d1Locked) return;
    if (d1Selections.includes(i)) d1Selections = d1Selections.filter(function (x) { return x !== i; });
    else d1Selections.push(i);
};

window.d1CheckAnswer = function d1CheckAnswer() {
    var q = d1Questions[d1Current];
    var correct = false;
    if (q.multi) {
        correct = JSON.stringify([].concat(d1Selections).sort(function (a, b) { return a - b; })) ===
                  JSON.stringify([].concat(q.answer).sort(function (a, b) { return a - b; }));
    } else {
        correct = d1Selections[0] === q.answer;
    }
    var fb   = document.getElementById('feedback');
    var expl = document.getElementById('explanation');
    var next = document.getElementById('nextBtn');
    if (correct) {
        if (fb)   { fb.textContent = '\u2705 Correct'; fb.classList.add('correct'); fb.classList.remove('incorrect'); }
        if (expl) expl.textContent = q.explanation;
        if (!d1State.quiz1.passed.includes(d1Current)) d1State.quiz1.passed.push(d1Current);
        if (next) next.disabled = false;
        d1Locked = true;
    } else {
        if (fb)   { fb.textContent = '\u274C Try again'; fb.classList.add('incorrect'); fb.classList.remove('correct'); }
        if (expl) expl.textContent = 'Take another look at the video notes and think about the 3D printing process.';
    }
    d1SaveState();
};

window.d1NextQuestion = function d1NextQuestion() {
    if (d1Current < d1Questions.length - 1) {
        d1Current++;
        d1Selections = [];
        d1RenderQuestion();
    } else {
        var prog    = document.getElementById('quizProgress');
        var qText   = document.getElementById('qText');
        var qOpts   = document.getElementById('qOptions');
        var fb      = document.getElementById('feedback');
        var expl    = document.getElementById('explanation');
        var nextBtn = document.getElementById('nextBtn');
        if (prog)    prog.textContent  = 'Done';
        if (qText)   qText.textContent = '\uD83C\uDF89 Quiz Complete';
        if (qOpts)   qOpts.innerHTML   = '<p>Nice work. You finished the intro quiz.</p>';
        if (fb)      fb.textContent    = 'You are ready to move on.';
        if (expl)    expl.textContent  = 'Reset the quiz if you want to try it again.';
        if (nextBtn) nextBtn.disabled  = true;
    }
    d1SaveState();
};

window.d1PrevQuestion = function d1PrevQuestion() {
    if (d1Current > 0) {
        d1Current--;
        d1Selections = [];
        d1RenderQuestion();
    }
};

window.d1ResetQuiz = function d1ResetQuiz() {
    d1Current    = 0;
    d1Selections = [];
    d1Locked     = false;
    d1State.quiz1 = { current: 0, passed: [] };
    d1RenderQuestion();
    var fb = document.getElementById('feedback');
    if (fb) fb.textContent = 'Quiz reset.';
    d1SaveState();
};

/* ── Part 4: Filament Quiz ─────────────────────────────────── */
var d1FilamentQuestions = [
    {
        q: 'Which filament is usually the easiest starting point for beginners?',
        options: ['PLA', 'PETG', 'Metal powder', 'Glue stick'],
        answer: 0,
        multi: false,
        explanation: 'The video explains that PLA is usually easier for beginners to print with.'
    },
    {
        q: 'Which statements about filament are true? (Select all)',
        options: ['Filament can absorb moisture', 'Different materials need different settings', 'All filament prints exactly the same way', 'Storage affects print quality'],
        answer: [0, 1, 3],
        multi: true,
        explanation: 'Moisture, settings, and storage all matter when printing with filament.'
    },
    {
        q: 'Which filament is often chosen when more durability is needed?',
        options: ['PETG', 'PLA', 'Paper', 'Cardboard'],
        answer: 0,
        multi: false,
        explanation: 'PETG is often chosen when you need more durability and impact resistance.'
    },
    {
        q: 'What can happen when filament absorbs too much moisture?',
        options: ['Poor print quality', 'Popping or bubbling sounds', 'Weaker prints', 'All of the above'],
        answer: 3,
        multi: false,
        explanation: 'The video explains that moist filament can bubble, pop, and create weaker prints.'
    },
    {
        q: 'Why should you choose the correct filament profile in the slicer?',
        options: ['It applies the right material settings', 'It changes the weather', 'It makes every print rainbow colored', 'It removes the need for slicing'],
        answer: 0,
        multi: false,
        explanation: 'Different materials need different temperature and print settings, so the right profile matters.'
    }
];

var d1FCurrent    = 0;
var d1FSelections = [];
var d1FLocked     = false;

function d1RenderFilamentQuestion() {
    var q = d1FilamentQuestions[d1FCurrent];
    d1State.quiz4.current = d1FCurrent;

    var prog    = document.getElementById('filamentQuizProgress');
    var qText   = document.getElementById('filamentQText');
    var qOpts   = document.getElementById('filamentQOptions');
    var fb      = document.getElementById('filamentFeedback');
    var expl    = document.getElementById('filamentExplanation');
    var nextBtn = document.getElementById('filamentNextBtn');

    if (prog)  prog.textContent  = 'Question ' + (d1FCurrent + 1) + ' of ' + d1FilamentQuestions.length;
    if (qText) qText.textContent = q.q;
    if (!qOpts) return;

    var html = '';
    q.options.forEach(function (opt, i) {
        var checked = d1FSelections.includes(i) ? 'checked' : '';
        if (q.multi) {
            html += '<label><input type="checkbox" ' + checked + ' onchange="window.d1SelectFMulti(' + i + ')"> ' + opt + '</label>';
        } else {
            html += '<label><input type="radio" name="d1fq" ' + checked + ' onchange="window.d1SelectFSingle(' + i + ')"> ' + opt + '</label>';
        }
    });
    qOpts.innerHTML = html;

    if (fb)   fb.textContent = '';
    if (expl) expl.textContent = '';
    if (nextBtn) nextBtn.disabled = !d1State.quiz4.passed.includes(d1FCurrent);
    d1FLocked = d1State.quiz4.passed.includes(d1FCurrent);
    d1SaveState();
}

window.d1SelectFSingle = function d1SelectFSingle(i) { if (!d1FLocked) d1FSelections = [i]; };
window.d1SelectFMulti  = function d1SelectFMulti(i) {
    if (d1FLocked) return;
    if (d1FSelections.includes(i)) d1FSelections = d1FSelections.filter(function (x) { return x !== i; });
    else d1FSelections.push(i);
};

window.d1CheckFilamentAnswer = function d1CheckFilamentAnswer() {
    var q = d1FilamentQuestions[d1FCurrent];
    var correct = false;
    if (q.multi) {
        correct = JSON.stringify([].concat(d1FSelections).sort(function (a, b) { return a - b; })) ===
                  JSON.stringify([].concat(q.answer).sort(function (a, b) { return a - b; }));
    } else {
        correct = d1FSelections[0] === q.answer;
    }
    var fb   = document.getElementById('filamentFeedback');
    var expl = document.getElementById('filamentExplanation');
    var next = document.getElementById('filamentNextBtn');
    if (correct) {
        if (fb)   { fb.textContent = '\u2705 Correct'; fb.classList.add('correct'); fb.classList.remove('incorrect'); }
        if (expl) expl.textContent = q.explanation;
        if (!d1State.quiz4.passed.includes(d1FCurrent)) d1State.quiz4.passed.push(d1FCurrent);
        if (next) next.disabled = false;
        d1FLocked = true;
    } else {
        if (fb)   { fb.textContent = '\u274C Try again'; fb.classList.add('incorrect'); fb.classList.remove('correct'); }
        if (expl) expl.textContent = 'Think about moisture, durability, and material settings from the video.';
    }
    d1SaveState();
};

window.d1NextFilamentQuestion = function d1NextFilamentQuestion() {
    if (d1FCurrent < d1FilamentQuestions.length - 1) {
        d1FCurrent++;
        d1FSelections = [];
        d1RenderFilamentQuestion();
    } else {
        var prog  = document.getElementById('filamentQuizProgress');
        var qText = document.getElementById('filamentQText');
        var qOpts = document.getElementById('filamentQOptions');
        var fb    = document.getElementById('filamentFeedback');
        var expl  = document.getElementById('filamentExplanation');
        var next  = document.getElementById('filamentNextBtn');
        if (prog)  prog.textContent  = 'Done';
        if (qText) qText.textContent = '\uD83C\uDF89 Filament Quiz Complete';
        if (qOpts) qOpts.innerHTML   = '<p>Nice work. You finished the filament quiz.</p>';
        if (fb)    fb.textContent    = 'You are ready to move on.';
        if (expl)  expl.textContent  = 'Reset the quiz if you want to try it again.';
        if (next)  next.disabled     = true;
    }
    d1SaveState();
};

window.d1PrevFilamentQuestion = function d1PrevFilamentQuestion() {
    if (d1FCurrent > 0) {
        d1FCurrent--;
        d1FSelections = [];
        d1RenderFilamentQuestion();
    }
};

window.d1ResetFilamentQuiz = function d1ResetFilamentQuiz() {
    d1FCurrent    = 0;
    d1FSelections = [];
    d1FLocked     = false;
    d1State.quiz4 = { current: 0, passed: [] };
    d1RenderFilamentQuestion();
    var fb = document.getElementById('filamentFeedback');
    if (fb) fb.textContent = 'Filament quiz reset.';
    d1SaveState();
};

/* ── Part 3: Matching Activity ─────────────────────────────── */
window.d1CheckMatching = function d1CheckMatching() {
    var answers = { match1: 'nozzle', match2: 'bed', match3: 'extruder', match4: 'frame' };
    var correct = 0;
    Object.keys(answers).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (el.value === answers[id]) {
            el.style.border = '2px solid #4caf50';
            correct++;
        } else {
            el.style.border = '2px solid #ff4d4d';
        }
    });

    var feedback    = document.getElementById('matchingFeedback');
    var hint        = document.getElementById('matchingHint');
    var completeBtn = document.getElementById('part3CompleteBtn');

    d1State.matchingAttempts = (d1State.matchingAttempts || 0) + 1;

    if (feedback) {
        feedback.textContent = correct === 4 ? '\u2705 All correct \u2014 nice work!' :
            'You got ' + correct + '/4 correct. You need at least 3 correct to move on.';
    }

    if (correct < 3 && d1State.matchingAttempts >= 2) {
        if (hint) {
            hint.style.display = 'block';
            hint.innerHTML = '<strong>Hint:</strong> Think about the flow of filament. What melts it? What pushes it? What surface does it sit on?';
        }
    } else {
        if (hint) { hint.style.display = 'none'; hint.innerHTML = ''; }
    }

    d1State.matchingScore = correct;
    if (completeBtn) completeBtn.disabled = correct < 3;

    d1UpdateProgress();
    d1SaveState();
};

window.d1ResetMatching = function d1ResetMatching() {
    ['match1', 'match2', 'match3', 'match4'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.value = '';
        el.style.border = '';
    });
    var feedback    = document.getElementById('matchingFeedback');
    var hint        = document.getElementById('matchingHint');
    var completeBtn = document.getElementById('part3CompleteBtn');
    if (feedback)    feedback.textContent   = '';
    if (hint)        { hint.style.display = 'none'; hint.textContent = ''; }
    if (completeBtn) completeBtn.disabled = true;
    d1State.matchingAttempts = 0;
    d1State.matchingScore    = 0;
    d1UpdateProgress();
    d1SaveState();
};

/* ── Part 3: Troubleshooting Activity ─────────────────────── */
var d1TroubleQuestions = [
    {
        q: 'The printer is moving, but no filament is coming out.',
        options: ['Nozzle', 'Bed', 'Frame'],
        answer: 0,
        explanation: 'Likely a clogged or cold nozzle.'
    },
    {
        q: 'The print keeps sliding around and will not stick.',
        options: ['Bed', 'Extruder', 'Frame'],
        answer: 0,
        explanation: 'This is a bed adhesion issue.'
    },
    {
        q: 'The printer shakes and layers look uneven.',
        options: ['Frame', 'Nozzle', 'Bed'],
        answer: 0,
        explanation: 'The frame provides stability.'
    },
    {
        q: 'Filament is not feeding into the nozzle.',
        options: ['Extruder', 'Bed', 'Frame'],
        answer: 0,
        explanation: 'The extruder pushes filament.'
    }
];

var d1TCurrent   = 0;
var d1TLocked    = false;
var d1TSelection = null;

function d1RenderDots() {
    var container = document.getElementById('troubleDots');
    if (!container) return;
    var html = '';
    for (var i = 0; i < d1TroubleQuestions.length; i++) {
        var color = '#ccc';
        if (i < (d1State.troubleshootingScore || 0)) color = '#4caf50';
        else if (i === d1TCurrent) color = '#7cc0ff';
        html += '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:' + color + '"></span>';
    }
    container.innerHTML = html;
}

function d1RenderTrouble() {
    d1RenderDots();
    var q = d1TroubleQuestions[d1TCurrent];

    var prog    = document.getElementById('troubleProgress');
    var tText   = document.getElementById('troubleText');
    var tOpts   = document.getElementById('troubleOptions');
    var fb      = document.getElementById('troubleshootingFeedback');
    var expl    = document.getElementById('troubleshootingExplanation');
    var nextBtn = document.getElementById('troubleNextBtn');

    if (prog)  prog.textContent  = 'Scenario ' + (d1TCurrent + 1) + ' of ' + d1TroubleQuestions.length;
    if (tText) tText.textContent = q.q;
    if (!tOpts) return;

    var html = '';
    q.options.forEach(function (opt, i) {
        html += '<label><input type="radio" name="d1trouble" onchange="window.d1SelectTrouble(' + i + ')"> ' + opt + '</label>';
    });
    tOpts.innerHTML = html;

    if (fb)      fb.textContent   = '';
    if (expl)    expl.textContent = '';
    if (nextBtn) nextBtn.disabled = true;
    d1TLocked    = false;
    d1TSelection = null;
}

window.d1SelectTrouble = function d1SelectTrouble(i) { if (!d1TLocked) d1TSelection = i; };

window.d1CheckTrouble = function d1CheckTrouble() {
    var q           = d1TroubleQuestions[d1TCurrent];
    var fb          = document.getElementById('troubleshootingFeedback');
    var expl        = document.getElementById('troubleshootingExplanation');
    var hint        = document.getElementById('troubleshootingHint');
    var completeBtn = document.getElementById('part3CompleteBtn');
    var nextBtn     = document.getElementById('troubleNextBtn');

    if (d1TSelection === q.answer) {
        if (fb)      { fb.textContent = '\u2705 Correct'; fb.classList.add('correct'); fb.classList.remove('incorrect'); }
        if (expl)    expl.textContent = q.explanation;
        if (nextBtn) nextBtn.disabled = false;
        d1TLocked = true;
        d1State.troubleshootingScore = (d1State.troubleshootingScore || 0) + 1;
        if (d1State.troubleshootingScore >= 3 && completeBtn) completeBtn.disabled = false;
    } else {
        if (fb)   { fb.textContent = '\u274C Try again'; fb.classList.add('incorrect'); fb.classList.remove('correct'); }
        d1State.troubleshooting.attempts++;
        if (d1State.troubleshooting.attempts >= 2 && hint) {
            hint.style.display = 'block';
            hint.textContent   = 'Think about what each part is responsible for.';
        }
    }
    d1UpdateProgress();
    d1SaveState();
};

window.d1NextTrouble = function d1NextTrouble() {
    if (d1TCurrent < d1TroubleQuestions.length - 1) {
        d1TCurrent++;
        d1RenderTrouble();
    } else {
        var fb = document.getElementById('troubleshootingFeedback');
        if ((d1State.troubleshootingScore || 0) >= 3) {
            if (fb) fb.textContent = '\uD83C\uDFC6 You mastered troubleshooting!';
            window.launchConfetti();
        } else {
            if (fb) fb.textContent = 'Keep practicing to reach mastery (3/4).';
        }
        var nextBtn = document.getElementById('troubleNextBtn');
        if (nextBtn) nextBtn.disabled = true;
    }
};

window.d1PrevTrouble = function d1PrevTrouble() {
    if (d1TCurrent > 0) {
        d1TCurrent--;
        d1RenderTrouble();
    }
};

window.d1ResetTrouble = function d1ResetTrouble() {
    var completeBtn = document.getElementById('part3CompleteBtn');
    if (completeBtn) completeBtn.disabled = true;
    d1TCurrent   = 0;
    d1TLocked    = false;
    d1TSelection = null;
    d1State.troubleshootingScore      = 0;
    d1State.troubleshooting.attempts  = 0;
    var hint = document.getElementById('troubleshootingHint');
    if (hint) { hint.style.display = 'none'; hint.textContent = ''; }
    var fb   = document.getElementById('troubleshootingFeedback');
    if (fb)   fb.textContent = '';
    var expl = document.getElementById('troubleshootingExplanation');
    if (expl) expl.textContent = '';
    d1RenderTrouble();
    d1UpdateProgress();
    d1SaveState();
};

} // end day1 guard

/* ── Day 1 Initialisation (DOMContentLoaded) ───────────────── */
document.addEventListener('DOMContentLoaded', function () {
    if (document.body.getAttribute('data-page') !== 'day1') return;

    /* Restore saved state */
    d1LoadState();

    /* Restore text inputs */
    ['printerChoice', 'partNozzle', 'partBed', 'partExtruder', 'partFrame', 'favoriteModel'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.value = d1State.texts[id] || '';
        el.addEventListener('input', function () {
            d1State.texts[id] = el.value;
            d1SaveState();
        });
    });

    /* Restore spool checklist */
    document.querySelectorAll('.spool-check').forEach(function (el) {
        el.checked = !!d1State.checks[el.id];
        el.addEventListener('change', function () {
            d1State.checks[el.id] = el.checked;
            d1UpdateSpoolButton();
            d1SaveState();
        });
    });
    d1UpdateSpoolButton();

    /* Restore completed parts */
    d1State.completedParts.forEach(function (part) {
        var card = document.getElementById('part' + part);
        if (card) card.open = false;
    });
    d1UpdateProgress();
    d1UpdateCardStates();

    /* Open the first incomplete, unlocked part */
    var opened = false;
    for (var n = 1; n <= D1_TOTAL_PARTS; n++) {
        if (!d1State.completedParts.includes(n)) {
            var card = document.getElementById('part' + n);
            if (card && !card.classList.contains('locked-card')) {
                card.setAttribute('open', '');
            }
            opened = true;
            break;
        }
    }
    if (!opened) {
        var last = document.getElementById('part' + D1_TOTAL_PARTS);
        if (last) last.setAttribute('open', '');
    }

    /* Restore quiz states and render */
    d1Current    = d1State.quiz1.current || 0;
    d1FCurrent   = d1State.quiz4.current || 0;
    d1RenderQuestion();
    d1RenderFilamentQuestion();
    d1RenderTrouble();

    /* Auto-open MakerWorld when Part 6 is opened */
    var part6 = document.getElementById('part6');
    if (part6) {
        part6.addEventListener('toggle', function () {
            if (part6.open) window.open('https://makerworld.com', '_blank');
        });
    }
});

/* ── Spool Button Helper (shared between guard and init) ────── */
function d1UpdateSpoolButton() {
    var checks = Array.from(document.querySelectorAll('.spool-check'));
    var btn    = document.getElementById('spoolCompleteBtn');
    if (btn) btn.disabled = !checks.every(function (c) { return c.checked; });
}
