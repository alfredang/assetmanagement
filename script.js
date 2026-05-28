/* =========================================================
   Apex Asset Management — script.js
   Navbar scroll, mobile menu, animated counters,
   testimonial carousel, fade-in observer, form submission.
   ========================================================= */

// ---------------------------------------------------------------------------
// WhatsApp Widget — configurable constants
// OPERATOR: replace WHATSAPP_NUMBER with your real WhatsApp Business number
// in international E.164 format WITHOUT the leading + (e.g. 6591234567).
// ---------------------------------------------------------------------------
const WHATSAPP_NUMBER  = '6591234567'; // <-- REPLACE THIS with your number
const WHATSAPP_PREFILL = 'Hello Apex — I would like to learn more about your climate-aligned mandates.';

(() => {
  'use strict';

  // Respect users who prefer reduced motion: skip transforms/counters.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  (function () {
    var root   = document.documentElement;
    var btn    = document.getElementById('themeToggle');
    var STORE  = 'apex-theme';

    function applyTheme(theme) {
      root.dataset.theme = theme;
      if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'));
    }

    // Sync button state to whatever the anti-flicker script set.
    applyTheme(root.dataset.theme || 'light');

    if (btn) {
      btn.addEventListener('click', function () {
        var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORE, next);
      });
    }

    // Track OS preference changes — only act if user has not chosen explicitly.
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', function (e) {
      if (!localStorage.getItem(STORE)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  })();

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Navbar scroll state ----------
     Toggle .scrolled past 50px. rAF-throttled to avoid layout thrash. */
  const navbar = document.getElementById('navbar');
  let scrollTicking = false;
  const onScroll = () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(onScroll);
      scrollTicking = true;
    }
  }, { passive: true });
  onScroll(); // set initial state

  /* ---------- Mobile menu toggle ---------- */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    const closeMenu = () => {
      hamburger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    };
    hamburger.addEventListener('click', () => {
      const open = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!open));
      navLinks.classList.toggle('open', !open);
    });
    // Close menu after clicking a link (smooth-scroll is handled by CSS).
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }

  /* ---------- Animated stat counters ----------
     Animate from 0 → data-target with easeOutCubic, run once via IO. */
  const stats = document.getElementById('stats');
  if (stats) {
    const animateNumber = (el) => {
      const target   = parseFloat(el.dataset.target || '0');
      const prefix   = el.dataset.prefix || '';
      const suffix   = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const duration = 1500;

      if (reducedMotion) {
        el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
        return;
      }

      const start = performance.now();
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const value = target * easeOutCubic(t);
        const formatted = decimals > 0
          ? value.toFixed(decimals)
          : Math.round(value).toLocaleString('en-US');
        el.textContent = `${prefix}${formatted}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const statsObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          stats.querySelectorAll('.stat-value').forEach(animateNumber);
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    statsObserver.observe(stats);
  }

  /* ---------- Testimonial carousel ---------- */
  const carousel = document.getElementById('carousel');
  const track    = document.getElementById('carouselTrack');
  const prevBtn  = document.getElementById('carouselPrev');
  const nextBtn  = document.getElementById('carouselNext');
  const dotsWrap = document.getElementById('carouselDots');

  if (carousel && track && dotsWrap) {
    const slides = track.children;
    const dots   = Array.from(dotsWrap.children);
    let current  = 0;
    let timer;

    const update = () => {
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => {
        if (i === current) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    };

    const goTo = (i) => {
      current = (i + slides.length) % slides.length;
      update();
    };
    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    const startAuto = () => {
      stopAuto();
      timer = setInterval(next, 7000);
    };
    const stopAuto = () => { if (timer) clearInterval(timer); };

    nextBtn?.addEventListener('click', () => { next(); startAuto(); });
    prevBtn?.addEventListener('click', () => { prev(); startAuto(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); startAuto(); }));

    // Pause auto-rotation on hover / focus-within for accessibility.
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin',  stopAuto);
    carousel.addEventListener('focusout', startAuto);

    update();
    if (!reducedMotion) startAuto();
  }

  /* ---------- Fade-in on scroll ---------- */
  const faders = document.querySelectorAll('.fade-in');
  if (faders.length) {
    const faderObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    faders.forEach(el => faderObserver.observe(el));
  }

  /* ---------- Contact form: validation + async submit ----------
     Submits via fetch so FormSubmit's success response keeps the user on-page.
     Requires the form's `action` to be configured with a real email; the first
     submission triggers FormSubmit's one-time confirmation email. */
  const form = document.getElementById('contactForm');
  if (form) {
    const status    = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-\s()]{6,}$/;

    const setError = (fieldName, message) => {
      const errEl = form.querySelector(`.field-error[data-for="${fieldName}"]`);
      const input = form.elements[fieldName];
      if (errEl) errEl.textContent = message;
      if (input) input.closest('.field')?.classList.toggle('invalid', Boolean(message));
    };

    const validate = () => {
      let ok = true;
      ['name', 'email', 'phone'].forEach(n => setError(n, ''));

      const name  = form.elements['name'].value.trim();
      const email = form.elements['email'].value.trim();
      const phone = form.elements['phone'].value.trim();

      if (!name)                       { setError('name', 'Please enter your name.'); ok = false; }
      if (!email)                      { setError('email', 'Email is required.'); ok = false; }
      else if (!emailRegex.test(email)){ setError('email', 'Please enter a valid email address.'); ok = false; }
      if (phone && !phoneRegex.test(phone)) { setError('phone', 'Please enter a valid phone number.'); ok = false; }

      return ok;
    };

    const setStatus = (message, kind) => {
      if (!status) return;
      status.textContent = message;
      status.classList.remove('success', 'error');
      if (kind) status.classList.add(kind);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('', '');
      if (!validate()) {
        setStatus('Please fix the highlighted fields and try again.', 'error');
        return;
      }

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          setStatus('Thank you — your enquiry has been sent. We’ll be in touch within one business day.', 'success');
          form.reset();
        } else {
          setStatus('Something went wrong. Please try again, or email us directly.', 'error');
        }
      } catch (err) {
        setStatus('Network error. Please check your connection and try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });

    // Clear inline errors as the user types.
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (t && t.name && t.closest('.field')?.classList.contains('invalid')) {
        setError(t.name, '');
      }
    });
  }

  /* ---------- WhatsApp Widget ---------- */
  (function () {
    const launcher = document.getElementById('waLauncher');
    const popover  = document.getElementById('waPopover');
    const closeBtn = document.getElementById('waClose');
    const ctaLink  = document.getElementById('waCta');
    const nudge    = document.getElementById('waNudge');

    if (!launcher || !popover) return;

    // Build the wa.me URL once and assign it to the CTA anchor.
    if (ctaLink) {
      ctaLink.href = 'https://wa.me/' + WHATSAPP_NUMBER +
        '?text=' + encodeURIComponent(WHATSAPP_PREFILL);
    }

    // --- Open / close helpers ---
    const openPopover = () => {
      popover.dataset.state = 'open';
      launcher.setAttribute('aria-expanded', 'true');
      // Move focus to the close button for keyboard users.
      if (closeBtn) closeBtn.focus();
    };

    const closePopover = () => {
      popover.dataset.state = 'closed';
      launcher.setAttribute('aria-expanded', 'false');
      // Return focus to the launcher button.
      launcher.focus();
    };

    const isOpen = () => popover.dataset.state === 'open';

    // --- Launcher click ---
    launcher.addEventListener('click', () => {
      isOpen() ? closePopover() : openPopover();
    });

    // --- Close button ---
    if (closeBtn) {
      closeBtn.addEventListener('click', closePopover);
    }

    // --- Escape key closes ---
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        closePopover();
      }
    });

    // --- Click outside to close ---
    document.addEventListener('click', (e) => {
      if (!isOpen()) return;
      const widget = document.getElementById('waWidget');
      if (widget && !widget.contains(e.target)) {
        closePopover();
      }
    });

    // --- One-time nudge tooltip ---
    // Show only if: reduced-motion is not preferred AND not yet seen this session.
    const nudgeSeen = sessionStorage.getItem('apex-wa-nudge-seen');
    if (nudge && !reducedMotion && nudgeSeen !== '1') {
      // Small delay so the page has settled before the nudge appears.
      setTimeout(() => {
        nudge.classList.add('is-visible');
        // Mark as seen after the animation completes (4.5 s) so it won't
        // re-appear if the user navigates via hash links on the same page.
        setTimeout(() => {
          sessionStorage.setItem('apex-wa-nudge-seen', '1');
          nudge.classList.remove('is-visible');
        }, 4500);
      }, 1200);
    }
  })();
})();
