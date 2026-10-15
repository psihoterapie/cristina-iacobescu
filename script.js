/* ============================================================
   CRISTINA IACOBESCU — script.js
   Handles: language switching · sticky nav · active section
             · smooth scroll · contact form · footer year
   ============================================================ */

'use strict';

/* ─── Config ──────────────────────────────────────────────── */
const SECTIONS = ['home', 'services', 'about', 'contact'];

/* ─── Init on DOM ready ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectSkipLink();
  initLangSwitcher();
  initStickyNav();
  initActiveSection();
  initSmoothScroll();
  initContactForm();
  initFooterYear();
});

/* ─── 1. Skip link (accessibility) ───────────────────────── */
function injectSkipLink() {
  const link = document.createElement('a');
  link.href = '#home';
  link.className = 'ci-skip-link';
  link.setAttribute('data-ro', 'Sari la conținut');
  link.setAttribute('data-en', 'Skip to content');
  link.textContent = 'Sari la conținut';
  document.body.prepend(link);
}

/* ─── 2. Language switcher ────────────────────────────────── */
function initLangSwitcher() {
  const buttons = document.querySelectorAll('.ci-lang-btn');
  const htmlEl  = document.documentElement;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.langTarget;
      if (htmlEl.dataset.lang === lang) return;

      // Update html attribute
      htmlEl.dataset.lang = lang;
      htmlEl.lang = lang;

      // Toggle button states
      buttons.forEach(b => {
        const isActive = b.dataset.langTarget === lang;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });

      // Translate all data-ro / data-en nodes
      translateAll(lang);

      // Show/hide language blocks (data-lang-block)
      toggleLangBlocks(lang);
    });
  });
}

/**
 * Walk every element that carries data-ro / data-en attributes
 * and update its textContent (or value for inputs).
 */
function translateAll(lang) {
  const attr = `data-${lang}`;
  const nodes = document.querySelectorAll(`[data-ro], [data-en]`);

  nodes.forEach(el => {
    const val = el.getAttribute(attr);
    if (val === null) return;

    // Labels: update text content
    if (el.tagName === 'LABEL' || el.tagName === 'SPAN' ||
        el.tagName === 'P'     || el.tagName === 'H1'   ||
        el.tagName === 'H2'    || el.tagName === 'H3'   ||
        el.tagName === 'LI'    || el.tagName === 'A'    ||
        el.tagName === 'BUTTON') {
      el.textContent = val;
    }
    // Inputs/textareas: update placeholder
    else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    }
  });

  // Show/hide language blocks on initial load too
  toggleLangBlocks(lang);

  // Also update document title meta description lang
  document.title = lang === 'ro'
    ? 'Cristina Iacobescu — Psiholog Clinician & Psihoterapeut'
    : 'Cristina Iacobescu — Clinical Psychologist & Psychotherapist';
}

/**
 * Show/hide elements that carry data-lang-block="ro|en".
 * These are full HTML blocks (not just text swaps).
 */
function toggleLangBlocks(lang) {
  document.querySelectorAll('[data-lang-block]').forEach(el => {
    el.style.display = el.dataset.langBlock === lang ? '' : 'none';
  });
}

/* ─── 3. Sticky nav shadow on scroll ──────────────────────── */
function initStickyNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const handler = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', handler, { passive: true });
  handler(); // run once on load
}

/* ─── 4. Active section highlight in navbar ───────────────── */
function initActiveSection() {
  const navLinks = document.querySelectorAll('.ci-navbar .nav-link');
  const sections = SECTIONS.map(id => document.getElementById(id)).filter(Boolean);

  if (!navLinks.length || !sections.length) return;

  const navH = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--ci-nav-h'), 10) || 70;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', isActive);
        link.setAttribute('aria-current', isActive ? 'page' : 'false');
      });
    });
  }, {
    rootMargin: `-${navH}px 0px -60% 0px`,
    threshold: 0
  });

  sections.forEach(s => observer.observe(s));
}

/* ─── 5. Smooth scroll + close mobile menu ───────────────── */
function initSmoothScroll() {
  // Close Bootstrap collapse when a nav link is clicked on mobile
  const navCollapse = document.getElementById('navMenu');
  const toggler     = document.querySelector('.navbar-toggler');

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;

      e.preventDefault();

      // Close mobile menu if open
      if (navCollapse && navCollapse.classList.contains('show')) {
        toggler?.click();
      }

      // Scroll with offset for fixed nav
      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--ci-nav-h'), 10) || 70;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─── 6. Contact form ─────────────────────────────────────── */
function initContactForm() {
  const form     = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Clear previous feedback
    clearFeedback(feedback);

    // Validate
    const errors = validateForm(form);
    if (errors.length) {
      showFeedback(feedback, errors.join(' '), 'error');
      return;
    }

    // Honeypot: bots fill the hidden field, humans don't
    if (form.querySelector('#fieldHoney')?.value) return;

    const lang = document.documentElement.dataset.lang || 'ro';
    setLoading(submitBtn, true);

    sendContactEmail(form, lang)
      .then(() => {
        showFeedback(feedback, lang === 'ro'
          ? 'Mesajul a fost trimis! Vă voi contacta în cel mai scurt timp.'
          : 'Your message has been sent! I will get back to you shortly.', 'success');
        form.reset();
      })
      .catch(() => {
        showFeedback(feedback, lang === 'ro'
          ? 'Mesajul nu a putut fi trimis. Vă rog încercați din nou sau scrieți-mi direct pe email / WhatsApp.'
          : 'Your message could not be sent. Please try again or contact me directly by email / WhatsApp.', 'error');
      })
      .finally(() => setLoading(submitBtn, false));
  });

  // Inline validation on blur
  form.querySelectorAll('.ci-form-input').forEach(field => {
    field.addEventListener('blur', () => {
      field.classList.toggle('is-invalid', !field.checkValidity());
    });
    field.addEventListener('input', () => {
      if (field.classList.contains('is-invalid')) {
        field.classList.toggle('is-invalid', !field.checkValidity());
      }
    });
  });
}

/*
 * Sends the form via FormSubmit (https://formsubmit.co) – a free form-to-email
 * relay over HTTPS. The message goes to CONTACT_TO.
 * The first submission triggers a one-time activation email to CONTACT_TO.
 */
const CONTACT_TO = 'cristina_iacobescu@yahoo.com';

function sendContactEmail(form, lang) {
  const val = sel => form.querySelector(sel)?.value.trim() || '';
  const name = val('#fieldName');

  const payload = {
    'Nume / Name':       name,
    'email':             val('#fieldEmail'),   // FormSubmit uses this as Reply-To
    'Telefon / Phone':   val('#fieldPhone') || '-',
    'Mesaj / Message':   val('#fieldMessage'),
    'Limba / Language':  lang === 'ro' ? 'Română' : 'English',
    _subject:  `Mesaj nou de pe site – ${name}`,
    _template: 'table',
    _captcha:  'false'
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  return fetch(`https://formsubmit.co/ajax/${CONTACT_TO}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal
  })
    .then(res => res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status)))
    .then(data => {
      if (String(data.success) !== 'true') throw new Error('Not sent');
      return data;
    })
    .finally(() => clearTimeout(timer));
}

function validateForm(form) {
  const lang   = document.documentElement.dataset.lang || 'ro';
  const errors = [];

  const name    = form.querySelector('#fieldName');
  const email   = form.querySelector('#fieldEmail');
  const message = form.querySelector('#fieldMessage');

  if (!name?.value.trim()) {
    errors.push(lang === 'ro' ? 'Vă rugăm introduceți numele.' : 'Please enter your name.');
    name?.classList.add('is-invalid');
  }

  if (!email?.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    errors.push(lang === 'ro' ? 'Adresă email invalidă.' : 'Invalid email address.');
    email?.classList.add('is-invalid');
  }

  if (!message?.value.trim()) {
    errors.push(lang === 'ro' ? 'Vă rugăm adăugați un mesaj.' : 'Please add a message.');
    message?.classList.add('is-invalid');
  }

  return errors;
}

function showFeedback(el, msg, type) {
  el.textContent = msg;
  el.className = `ci-form-feedback ${type}`;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFeedback(el) {
  el.textContent = '';
  el.className = 'ci-form-feedback';
  document.querySelectorAll('.ci-form-input.is-invalid')
    .forEach(f => f.classList.remove('is-invalid'));
}

function setLoading(btn, isLoading) {
  if (!btn) return;
  const lang = document.documentElement.dataset.lang || 'ro';
  if (isLoading) {
    btn.disabled = true;
    btn.querySelector('span').textContent =
      lang === 'ro' ? 'Se trimite…' : 'Sending…';
  } else {
    btn.disabled = false;
    btn.querySelector('span').textContent =
      lang === 'ro' ? 'Trimite mesajul' : 'Send message';
  }
}

/* ─── 7. Footer year ──────────────────────────────────────── */
function initFooterYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll('.ci-footer-year').forEach((el) => { el.textContent = year; });
}
