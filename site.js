/**
 * GCI 3D Print Lab – Shared Site JavaScript
 * Handles: mobile nav toggle, active nav states, skip link
 */
(function () {
  'use strict';

  /** Breakpoint that matches the CSS nav collapse point */
  var MOBILE_BREAKPOINT = 768;

  // ── Mobile Navigation Toggle ────────────────────────────────
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var menu   = document.querySelector('.nav-menu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('is-open', !expanded);
    });

    // Close menu on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        toggle.focus();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        if (menu.classList.contains('is-open')) {
          toggle.setAttribute('aria-expanded', 'false');
          menu.classList.remove('is-open');
        }
      }
    });

    // Close menu on nav link click (mobile)
    menu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth < MOBILE_BREAKPOINT) {
          toggle.setAttribute('aria-expanded', 'false');
          menu.classList.remove('is-open');
        }
      });
    });
  }

  // ── Active Nav State ────────────────────────────────────────
  function setActiveNav() {
    var path = window.location.pathname;
    var links = document.querySelectorAll('.nav-link');

    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;

      // Normalize hrefs
      var linkPath = href.replace(/\/$/, '') || '/';
      var currentPath = path.replace(/\/$/, '') || '/';

      // Exact match or sub-path match (e.g. /training/* matches /training)
      if (
        currentPath === linkPath ||
        (linkPath !== '/' && currentPath.startsWith(linkPath))
      ) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('active');
      }
    });
  }

  // ── Theme Persistence ───────────────────────────────────────
  function initTheme() {
    var saved = localStorage.getItem('gci-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }

  // ── Initialize ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initNav();
    setActiveNav();
  });
}());
