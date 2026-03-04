/* ============================================================
   KOMILAB — main.js
   Theme, progress, copy, TOC, mobile nav, search
   ============================================================ */

(function () {
  'use strict';

  /* ── THEME TOGGLE ─────────────────────────────────────────── */
  const THEME_KEY = 'komilab-theme';
  const root = document.documentElement;

  function getTheme() {
    return localStorage.getItem(THEME_KEY) ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.setAttribute('aria-label', theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre');
    btn.innerHTML = theme === 'dark'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  applyTheme(getTheme());

  document.addEventListener('DOMContentLoaded', function () {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      applyTheme(getTheme());
      themeBtn.addEventListener('click', function () {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
      });
    }

    /* ── READING PROGRESS ───────────────────────────────────── */
    const progressBar = document.getElementById('reading-progress');
    if (progressBar) {
      function updateProgress() {
        const scrollTop  = window.scrollY;
        const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
        const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = Math.min(pct, 100) + '%';
      }
      window.addEventListener('scroll', updateProgress, { passive: true });
    }

    /* ── COPY-TO-CLIPBOARD ──────────────────────────────────── */
    document.querySelectorAll('pre').forEach(function (pre) {
      const wrapper = document.createElement('div');
      wrapper.className = 'code-wrapper';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.setAttribute('aria-label', 'Copier le code');
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier';
      wrapper.appendChild(btn);

      btn.addEventListener('click', function () {
        const code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.innerText).then(function () {
          btn.classList.add('copied');
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copie';
          setTimeout(function () {
            btn.classList.remove('copied');
            btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier';
          }, 2000);
        });
      });
    });

    /* ── MOBILE NAV ─────────────────────────────────────────── */
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks  = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function () {
        const open = navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', open);
      });
      document.addEventListener('click', function (e) {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('open');
        }
      });
    }

    /* ── ACTIVE NAV LINK ────────────────────────────────────── */
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      if (a.getAttribute('href') && currentPath.startsWith(a.getAttribute('href')) && a.getAttribute('href') !== '/') {
        a.classList.add('active');
      }
    });

    /* ── TOC ACTIVE HIGHLIGHT ───────────────────────────────── */
    const tocLinks = document.querySelectorAll('.lab-toc nav a');
    if (tocLinks.length > 0) {
      const headings = Array.from(document.querySelectorAll('.lab-content h2, .lab-content h3, .lab-content h4'));
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            tocLinks.forEach(function (l) { l.classList.remove('active'); });
            const active = document.querySelector('.lab-toc nav a[href="#' + id + '"]');
            if (active) active.classList.add('active');
          }
        });
      }, { rootMargin: '-20% 0% -60% 0%' });
      headings.forEach(function (h) { if (h.id) observer.observe(h); });
    }

    /* ── SEARCH (client-side) ───────────────────────────────── */
    const searchInput   = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    if (searchInput && searchResults) {
      let index = null;

      fetch('/index.json')
        .then(function (r) { return r.json(); })
        .then(function (data) { index = data; });

      searchInput.addEventListener('input', function () {
        const q = searchInput.value.trim().toLowerCase();
        if (!index || q.length < 2) {
          searchResults.innerHTML = '';
          return;
        }
        const results = index.filter(function (item) {
          return (item.title + ' ' + item.summary + ' ' + (item.tags || []).join(' '))
            .toLowerCase().includes(q);
        }).slice(0, 8);

        if (results.length === 0) {
          searchResults.innerHTML = '<p class="text-muted">Aucun r\u00e9sultat pour cette recherche.</p>';
          return;
        }

        searchResults.innerHTML = results.map(function (r) {
          return '<div class="search-result-item">' +
            '<a href="' + r.permalink + '"><strong>' + r.title + '</strong></a>' +
            '<p class="text-muted" style="font-size:0.8rem;margin:4px 0 0">' + (r.summary || '') + '</p>' +
            '</div>';
        }).join('');
      });
    }

    /* ── NEWSLETTER FORM ────────────────────────────────────── */
    document.querySelectorAll('.newsletter-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        if (!emailInput || !emailInput.value) return;
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          btn.textContent = 'Inscription...';
          btn.disabled = true;
        }
        // Replace with actual newsletter API endpoint
        setTimeout(function () {
          form.innerHTML = '<p style="color:var(--color-success);font-weight:600">Merci ! V\u00e9rifiez votre boite mail pour confirmer.</p>';
        }, 1200);
      });
    });

  }); // DOMContentLoaded

})();
