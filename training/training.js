/* ============================================================
   GCI 3D Printing Training – Shared JavaScript
   Used by: Intro_to_3D_Printing_Day1.html through Day5.html
   ============================================================ */

/* ── Theme Switcher ────────────────────────────────────────── */
(function () {
    const themeSelector = document.getElementById('theme-selector');
    const themeStorageKey = 'gci-3d-printing-theme-v1';

    function applyTheme(theme) {
        const normalizedTheme = ['dark', 'light', 'high-contrast'].includes(theme) ? theme : 'dark';
        if (normalizedTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', normalizedTheme);
        }
        if (themeSelector) {
            themeSelector.value = normalizedTheme;
        }
        localStorage.setItem(themeStorageKey, normalizedTheme);
    }

    function restoreTheme() {
        const savedTheme = localStorage.getItem(themeStorageKey) || 'dark';
        applyTheme(savedTheme);
    }

    if (themeSelector) {
        themeSelector.addEventListener('change', function () {
            applyTheme(this.value);
        });
    }

    restoreTheme();
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
