/**
 * GCI 3D Print Lab – Print Workflow JavaScript
 * ─────────────────────────────────────────────
 * Handles:
 *   • Tab navigation on requests.html
 *   • Student print submission form
 *   • Staff print request form
 *   • Live public queue (fetch, render, filter, auto-refresh)
 *
 * Requires print-config.js to be loaded first (defines window.PRINT_CONFIG).
 */

(function (global) {
  'use strict';

  /* ── Config helper ─────────────────────────────────────── */
  function cfg(key) {
    return (global.PRINT_CONFIG && global.PRINT_CONFIG[key]) || '';
  }

  /* ── Utilities ─────────────────────────────────────────── */

  /** Show or hide an aria-live feedback region. */
  function setFeedback(el, type, message) {
    if (!el) return;
    el.className = 'form-feedback form-feedback--' + type + ' is-visible';
    var iconEl = el.querySelector('.form-feedback__icon');
    var msgEl  = el.querySelector('.form-feedback__msg');
    if (iconEl) iconEl.textContent = type === 'success' ? '✅' : '❌';
    if (msgEl)  msgEl.textContent  = message;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /** Clear a feedback region. */
  function clearFeedback(el) {
    if (!el) return;
    el.className = 'form-feedback';
    var msgEl = el.querySelector('.form-feedback__msg');
    if (msgEl) msgEl.textContent = '';
  }

  /** Set button loading state. */
  function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    // Store the original text the first time we enter loading state
    if (isLoading && !btn.dataset.defaultText) {
      btn.dataset.defaultText = btn.textContent.trim();
    }
    btn.disabled = isLoading;
    btn.setAttribute('aria-busy', String(isLoading));
    btn.textContent = isLoading
      ? (btn.dataset.loadingText || 'Submitting…')
      : (btn.dataset.defaultText || btn.textContent);
  }

  /** Collect all checked checkbox values from a fieldset. */
  function collectChecked(fieldset) {
    var checked = fieldset ? Array.from(fieldset.querySelectorAll('input[type="checkbox"]:checked')) : [];
    return checked.map(function (cb) { return cb.value; });
  }

  /**
   * Submit a payload to a Google Apps Script endpoint.
   * Uses mode:'no-cors' because GAS does not return CORS headers on POST by default.
   * The request is sent as a plain-text JSON body to avoid a CORS preflight.
   * The response will be opaque, so we treat a network completion as success.
   */
  function submitToGAS(endpoint, payload, onSuccess, onError) {
    if (!endpoint || endpoint === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      onError('The submission endpoint has not been configured yet. Please ask your instructor to complete the Google Apps Script setup described in the README.');
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    })
      .then(function () {
        // Response is opaque in no-cors mode — treat completion as success.
        onSuccess();
      })
      .catch(function (err) {
        console.error('[PrintWorkflow] Submission error:', err);
        onError('Could not reach the submission endpoint. Please check your internet connection and try again.');
      });
  }

  /* ── Tab Navigation ─────────────────────────────────────── */
  function initTabs() {
    var tabList = document.querySelector('[role="tablist"]');
    if (!tabList) return;

    var tabs   = Array.from(tabList.querySelectorAll('[role="tab"]'));
    var panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

    function activateTab(targetTab) {
      tabs.forEach(function (t) {
        var selected = t === targetTab;
        t.setAttribute('aria-selected', String(selected));
        t.setAttribute('tabindex', selected ? '0' : '-1');
        t.classList.toggle('tab-btn', true);
      });

      var targetPanelId = targetTab.getAttribute('aria-controls');
      panels.forEach(function (p) {
        p.classList.toggle('is-active', p.id === targetPanelId);
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activateTab(tab);
      });

      tab.addEventListener('keydown', function (e) {
        var idx = tabs.indexOf(tab);
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          tabs[(idx + 1) % tabs.length].focus();
          activateTab(tabs[(idx + 1) % tabs.length]);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          tabs[(idx - 1 + tabs.length) % tabs.length].focus();
          activateTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
        }
      });
    });

    // Activate tab based on URL hash, or default to first
    var hash = global.location && global.location.hash;
    var hashTab = hash ? tabList.querySelector('[aria-controls="' + hash.slice(1) + '"]') : null;
    activateTab(hashTab || tabs[0]);
  }

  /* ── Student Form ───────────────────────────────────────── */
  function initStudentForm() {
    var form     = document.getElementById('student-form');
    if (!form) return;

    var btn      = form.querySelector('[type="submit"]');
    var feedback = document.getElementById('student-feedback');

    // Store default button label
    if (btn) btn.dataset.defaultText = btn.textContent;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFeedback(feedback);

      // Basic HTML5 validity
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Checklist: all boxes must be checked
      var checklistFieldset = form.querySelector('[data-checklist]');
      var checkboxes = checklistFieldset ? checklistFieldset.querySelectorAll('input[type="checkbox"]') : [];
      var unchecked  = Array.from(checkboxes).filter(function (cb) { return !cb.checked; });
      if (unchecked.length > 0) {
        setFeedback(feedback, 'error', 'Please confirm all pre-print checklist items before submitting.');
        return;
      }

      setButtonLoading(btn, true);

      var payload = {
        requestType:        'student',
        firstName:          (form.querySelector('#s-firstName')        || {}).value || '',
        lastName:           (form.querySelector('#s-lastName')         || {}).value || '',
        email:              (form.querySelector('#s-email')            || {}).value || '',
        className:          (form.querySelector('#s-className')        || {}).value || '',
        classPeriod:        (form.querySelector('#s-classPeriod')      || {}).value || '',
        projectType:        (form.querySelector('#s-projectType')      || {}).value || '',
        fileName:           (form.querySelector('#s-fileName')         || {}).value || '',
        fileLink:           (form.querySelector('#s-fileLink')         || {}).value || '',
        estimatedPrintTime: (form.querySelector('#s-estimatedPrint')   || {}).value || '',
        filamentColor:      (form.querySelector('#s-filamentColor')    || {}).value || '',
        printerRequested:   (form.querySelector('#s-printerRequested') || {}).value || '',
        checklist:          collectChecked(checklistFieldset),
        notes:              (form.querySelector('#s-notes')            || {}).value || ''
      };

      submitToGAS(
        cfg('STUDENT_SUBMIT_ENDPOINT'),
        payload,
        function () {
          setButtonLoading(btn, false);
          setFeedback(feedback, 'success', 'Your print request was submitted! A lab operator will review it and follow up with you.');
          form.reset();
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        function (msg) {
          setButtonLoading(btn, false);
          setFeedback(feedback, 'error', msg);
        }
      );
    });
  }

  /* ── Staff Form ─────────────────────────────────────────── */
  function initStaffForm() {
    var form     = document.getElementById('staff-form');
    if (!form) return;

    var btn      = form.querySelector('[type="submit"]');
    var feedback = document.getElementById('staff-feedback');

    if (btn) btn.dataset.defaultText = btn.textContent;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFeedback(feedback);

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      setButtonLoading(btn, true);

      var payload = {
        requestType:      'staff',
        firstName:        (form.querySelector('#t-firstName')       || {}).value || '',
        lastName:         (form.querySelector('#t-lastName')        || {}).value || '',
        department:       (form.querySelector('#t-department')      || {}).value || '',
        email:            (form.querySelector('#t-email')           || {}).value || '',
        projectName:      (form.querySelector('#t-projectName')     || {}).value || '',
        purpose:          (form.querySelector('#t-purpose')         || {}).value || '',
        quantity:         (form.querySelector('#t-quantity')        || {}).value || '',
        neededByDate:     (form.querySelector('#t-neededByDate')    || {}).value || '',
        fileName:         (form.querySelector('#t-fileName')        || {}).value || '',
        fileLink:         (form.querySelector('#t-fileLink')        || {}).value || '',
        filamentColor:    (form.querySelector('#t-filamentColor')   || {}).value || '',
        printerRequested: (form.querySelector('#t-printerRequested')|| {}).value || '',
        notes:            (form.querySelector('#t-notes')           || {}).value || ''
      };

      submitToGAS(
        cfg('STAFF_SUBMIT_ENDPOINT'),
        payload,
        function () {
          setButtonLoading(btn, false);
          setFeedback(feedback, 'success', 'Your staff request was submitted! The lab will follow up with you by email.');
          form.reset();
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        function (msg) {
          setButtonLoading(btn, false);
          setFeedback(feedback, 'error', msg);
        }
      );
    });
  }

  /* ── Live Queue ─────────────────────────────────────────── */

  var queueRefreshTimer  = null;
  var queueCurrentFilter = 'all';
  var queueAllJobs       = [];

  /** Sanitized fields GAS must return — no names, emails, or file links. */
  var ALLOWED_FIELDS = ['jobId', 'projectType', 'status', 'printerAssigned', 'pickupStatus'];

  /** Strict-sanitize a job object so only allowed fields reach the DOM. */
  function sanitizeJob(raw) {
    var clean = {};
    ALLOWED_FIELDS.forEach(function (k) {
      clean[k] = (raw[k] || '').toString().trim();
    });
    return clean;
  }

  function statusBadgeClass(status) {
    var s = status.toLowerCase();
    if (s === 'waiting')           return 'badge badge--waiting';
    if (s === 'printing')          return 'badge badge--printing';
    if (s === 'complete')          return 'badge badge--complete';
    if (s === 'ready for pickup')  return 'badge badge--pickup';
    return 'badge badge--unknown';
  }

  function renderQueueTable(jobs) {
    var container  = document.getElementById('queue-table-container');
    var emptyEl    = document.getElementById('queue-empty');
    var errorEl    = document.getElementById('queue-error');
    var loadingEl  = document.getElementById('queue-loading');

    if (!container) return;

    if (loadingEl) loadingEl.hidden = true;
    if (errorEl)   errorEl.hidden   = true;

    if (!jobs || jobs.length === 0) {
      container.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    if (emptyEl)   emptyEl.hidden   = true;
    container.hidden = false;

    var tbody = container.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    jobs.forEach(function (job) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><code style="font-size:var(--text-xs);color:var(--color-primary-light);">' + escHtml(job.jobId) + '</code></td>' +
        '<td>' + escHtml(job.projectType) + '</td>' +
        '<td><span class="' + statusBadgeClass(job.status) + '">' + escHtml(job.status) + '</span></td>' +
        '<td>' + escHtml(job.printerAssigned) + '</td>' +
        '<td>' + (job.pickupStatus.toLowerCase() === 'yes'
          ? '<span class="badge badge--complete">Ready</span>'
          : '<span class="badge badge--unknown">Not Yet</span>') + '</td>';
      tbody.appendChild(tr);
    });
  }

  function showQueueLoading() {
    var loadingEl = document.getElementById('queue-loading');
    var emptyEl   = document.getElementById('queue-empty');
    var errorEl   = document.getElementById('queue-error');
    var container = document.getElementById('queue-table-container');
    if (loadingEl) loadingEl.hidden = false;
    if (emptyEl)   emptyEl.hidden   = true;
    if (errorEl)   errorEl.hidden   = true;
    if (container) container.hidden = true;
  }

  function showQueueError(msg) {
    var loadingEl = document.getElementById('queue-loading');
    var emptyEl   = document.getElementById('queue-empty');
    var errorEl   = document.getElementById('queue-error');
    var container = document.getElementById('queue-table-container');
    if (loadingEl)  loadingEl.hidden = true;
    if (emptyEl)    emptyEl.hidden   = true;
    if (container)  container.hidden = true;
    if (errorEl) {
      errorEl.hidden = false;
      var msgEl = errorEl.querySelector('.queue-state__body');
      if (msgEl) msgEl.textContent = msg || 'Unable to load the queue. Please try again later.';
    }
  }

  function applyQueueFilter(filter) {
    queueCurrentFilter = filter;

    var buttons = document.querySelectorAll('.queue-filter-btn');
    buttons.forEach(function (btn) {
      var active = btn.dataset.filter === filter;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    var filtered = filter === 'all'
      ? queueAllJobs
      : queueAllJobs.filter(function (j) {
          return j.status.toLowerCase() === filter.toLowerCase();
        });

    renderQueueTable(filtered);
  }

  function updateLastRefreshed() {
    var el = document.getElementById('queue-last-updated');
    if (!el) return;
    var now = new Date();
    el.textContent = 'Last updated: ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function fetchQueue() {
    var endpoint = cfg('QUEUE_ENDPOINT');
    if (!endpoint || endpoint === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      showQueueError('The queue endpoint has not been configured yet. See the README for Google Apps Script setup instructions.');
      return;
    }

    showQueueLoading();

    fetch(endpoint + (endpoint.includes('?') ? '&' : '?') + '_t=' + Date.now(), {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
      cache: 'no-store'
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error('Unexpected response format');

        // Sanitize every job — remove any private fields GAS accidentally includes
        queueAllJobs = data.map(sanitizeJob);

        updateLastRefreshed();
        applyQueueFilter(queueCurrentFilter);
      })
      .catch(function (err) {
        console.error('[PrintWorkflow] Queue fetch error:', err);
        showQueueError('Could not load the print queue. Check your internet connection or try again shortly.');
      });
  }

  function initQueue() {
    var queueSection = document.getElementById('queue-section');
    if (!queueSection) return;

    // Filter buttons
    var filterBtns = queueSection.querySelectorAll('.queue-filter-btn');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyQueueFilter(btn.dataset.filter || 'all');
      });
    });

    // Initial load
    fetchQueue();

    // Auto-refresh
    var interval = (cfg('QUEUE_REFRESH_INTERVAL') || 60000);
    queueRefreshTimer = setInterval(fetchQueue, interval);

    // Manual refresh button
    var refreshBtn = document.getElementById('queue-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        clearInterval(queueRefreshTimer);
        fetchQueue();
        queueRefreshTimer = setInterval(fetchQueue, interval);
      });
    }
  }

  /* ── HTML escape ──────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Bootstrap ──────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initStudentForm();
    initStaffForm();
    initQueue();
  });

}(window));
