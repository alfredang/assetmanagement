/* =========================================================
   Apex Asset Management — script.js
   Navbar scroll, mobile menu, animated counters,
   testimonial carousel, fade-in observer, form submission.
   ========================================================= */

(() => {
  'use strict';

  // Respect users who prefer reduced motion: skip transforms/counters.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      timer = setInterval(next, 5000);
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
})();
