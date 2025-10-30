// Initialize interactions after the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const mobileMenuButton = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      mobileMenuButton.setAttribute('aria-expanded', (isOpen).toString());
    });
  }

  // Smooth scrolling for in-page links (skip modal triggers and dummy # links)
  document.querySelectorAll('a[href^="#"]:not([data-modal])').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href') || '';
      if (href === '#' || href.trim() === '') return;
      let target = null;
      try { target = document.querySelector(href); } catch (_) { target = null; }
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (mobileMenuButton) mobileMenuButton.setAttribute('aria-expanded', 'false');
        // If navigating to services, hint the reveal a moment after scroll starts
        if (href === '#services') {
          setTimeout(() => { target.classList.add('in-view'); }, 250);
        }
      }
    });
  });

  // Enhanced contact form UX (validation + inline messaging)
  const form = document.querySelector('.contact-form');
  if (form) {
    // Hide placeholder icon/label when user types
    const attachValueStateHandlers = () => {
      form.querySelectorAll('.form-field .input').forEach((el) => {
        const field = el.closest('.form-field');
        if (!field) return;
        const update = () => {
          const hasValue = (el.value || '').trim().length > 0;
          field.classList.toggle('has-value', hasValue);
        };
        // Initialize state (handles autofill/remembered values)
        update();
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      });
    };

    attachValueStateHandlers();

    const hint = form.querySelector('.form-hint');
    const submitBtn = form.querySelector('button[type="submit"]');
    const firstName = form.querySelector('#firstName');
    const lastName = form.querySelector('#lastName');
    const email = form.querySelector('#email');
    const message = form.querySelector('#message');

    const setHint = (text, type) => {
      if (!hint) return;
      hint.textContent = text || '';
      hint.classList.remove('error', 'success');
      if (type) hint.classList.add(type);
    };

    const emailValid = (val) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(String(val || '').toLowerCase());

    const validateField = (el) => {
      if (!el) return true;
      const id = el.id;
      let ok = true;
      if (id === 'firstName') ok = el.value.trim().length > 0;
      if (id === 'email') ok = emailValid(el.value);
      if (id === 'message') ok = el.value.trim().length > 0;
      el.classList.toggle('invalid', !ok);
      el.classList.toggle('valid', ok && el.value.trim().length > 0);
      return ok;
    };

    [firstName, email, message].forEach((el) => {
      if (!el) return;
      el.addEventListener('blur', () => validateField(el));
      el.addEventListener('input', () => validateField(el));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const okFirst = validateField(firstName);
      const okEmail = validateField(email);
      const okMsg = validateField(message);

      if (!(okFirst && okEmail && okMsg)) {
        setHint('Please provide your first name, a valid email, and a brief message.', 'error');
        const firstInvalid = [firstName, email, message].find((el) => el && el.classList.contains('invalid'));
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Non-intrusive success state (no alert)
      setHint('Sending…', null);
      if (submitBtn) {
        submitBtn.disabled = true;
        const original = submitBtn.innerHTML;
        submitBtn.dataset.original = original;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Sending…';
        // Simulate a quick success without backend
        setTimeout(() => {
          setHint('Thank you for your message! We will get back to you soon.', 'success');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.original || original;
          }
          // Optionally clear message only
          if (message) message.value = '';
          [firstName, email, message].forEach((el) => el && el.classList.remove('valid', 'invalid'));
        }, 500);
      }
    });
  }

  // Privacy Policy modal
  const privacyModal = document.getElementById('privacy-modal');
  const privacyLink = document.querySelector('a[data-modal="privacy"]');
  let lastFocus = null;
  const openModal = (modal) => {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const focusEl = modal.querySelector('.modal-close') || modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusEl && focusEl.focus();
  };
  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus();
  };
  if (privacyLink && privacyModal) {
    privacyLink.addEventListener('click', (e) => { e.preventDefault(); openModal(privacyModal); });
    privacyModal.querySelectorAll('[data-close="privacy"]').forEach((el) => {
      el.addEventListener('click', () => closeModal(privacyModal));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && privacyModal.classList.contains('open')) closeModal(privacyModal);
    });
  }
  // Generic modal wiring
  const wireModal = (name) => {
    const modal = document.getElementById(`${name}-modal`);
    const triggers = document.querySelectorAll(`[data-modal="${name}"]`);
    if (!modal || triggers.length === 0) return;
    let lastFocusEl = null;
    const open = () => {
      lastFocusEl = document.activeElement;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const focusEl = modal.querySelector('.modal-close') || modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusEl && focusEl.focus();
    };
    const close = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lastFocusEl && lastFocusEl.focus && lastFocusEl.focus();
    };
    triggers.forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); open(); }));
    modal.querySelectorAll(`[data-close="${name}"]`).forEach((el) => el.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
  };

  wireModal('privacy');
  wireModal('terms');
  // Services section: one-time reveal on scroll (mobile-friendly)
  const servicesSection = document.querySelector('#services');
  if (servicesSection) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      servicesSection.classList.add('in-view');
    } else if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            servicesSection.classList.add('in-view');
            obs.unobserve(servicesSection);
          }
        });
      }, { threshold: 0.15 });
      observer.observe(servicesSection);
    } else {
      // Fallback: reveal immediately
      servicesSection.classList.add('in-view');
    }
  }

  // Footer reveal on scroll
  const footerEl = document.querySelector('.site-footer');
  if (footerEl) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      footerEl.classList.add('in-view');
    } else if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            footerEl.classList.add('in-view');
          }
        });
      }, { threshold: 0.2 });
      observer.observe(footerEl);
    } else {
      footerEl.classList.add('in-view');
    }
  }

  // Generic slider initializer for sections (capabilities, pricing)
  const initSlider = (ns) => {
    const slider = document.querySelector(`.${ns}-slider`);
    if (!slider) return;
    const slidesWrap = slider.querySelector(`.${ns}-slides`);
    const slides = Array.from(slidesWrap.querySelectorAll(`.${ns}-slide`));
    let prev = slider.querySelector(`.${ns}-arrow.prev`);
    let next = slider.querySelector(`.${ns}-arrow.next`);
    // Dots may live outside the slider for certain sections
    let dotsWrap = slider.querySelector(`.${ns}-dots`) || (slider.parentElement && slider.parentElement.querySelector(`.${ns}-dots`));
    if (ns === 'why') {
      const section = slider.closest('section') || document;
      prev = prev || section.querySelector('.why-arrow-global.prev');
      next = next || section.querySelector('.why-arrow-global.next');
      dotsWrap = dotsWrap || section.querySelector('.why-dots');
    }

    let index = 0;

    const visibleCount = () => {
      const w = window.innerWidth;
      if (w >= 1024) return 3;
      if (w >= 640) return 2;
      return 1;
    };

    const pageCount = () => Math.ceil(slides.length / visibleCount());

    const updateDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (let i = 0; i < pageCount(); i++) {
        const d = document.createElement('button');
        d.className = `${ns}-dot` + (i === Math.floor(index / visibleCount()) ? ' active' : '');
        d.setAttribute('aria-label', `Go to slide ${i + 1}`);
        d.addEventListener('click', () => { index = i * visibleCount(); apply(); });
        dotsWrap.appendChild(d);
      }
    };

    const basePercent = () => {
      const vis = visibleCount();
      if (index < 0) index = 0;
      if (index > Math.max(0, slides.length - vis)) index = Math.max(0, slides.length - vis);
      return (index / slides.length) * 100 * (slides.length / visibleCount());
    };

    const apply = () => {
      const vis = visibleCount();
      const maxIndex = Math.max(0, slides.length - vis);
      if (index > maxIndex) index = 0; // wrap forward
      if (index < 0) index = maxIndex; // wrap backward

      // keep CSS var for why slider widths in sync
      if (ns === 'why') {
        slider.style.setProperty('--why-visible', vis);
        const gapPx = parseFloat(getComputedStyle(slidesWrap).gap || '0');
        const slideW = slides[0]?.getBoundingClientRect().width || 0;
        const translate = index * (slideW + gapPx);
        slidesWrap.style.transform = `translateX(-${translate}px)`;
      } else {
        const percent = basePercent();
        slidesWrap.style.transform = `translateX(-${percent}%)`;
      }

      // mark visible slides as active
      slides.forEach((el, i) => {
        const isActive = i >= index && i < index + vis;
        el.classList.toggle(`${ns}-active`, isActive);
      });
      updateDots();
    };

    const resetAuto = () => {};

    prev && prev.addEventListener('click', () => { index -= 1; apply(); resetAuto(); });
    next && next.addEventListener('click', () => { index += 1; apply(); resetAuto(); });

    let startX = 0; let dx = 0; let dragging = false;
    const start = (x) => { dragging = true; startX = x; slidesWrap.style.transition = 'none'; stopAuto(); };
    const move = (x) => { if (!dragging) return; dx = x - startX; const percent = basePercent(); slidesWrap.style.transform = `translateX(calc(-${percent}% + ${dx}px))`; };
    const end = () => { if (!dragging) return; dragging = false; slidesWrap.style.transition = ''; if (Math.abs(dx) > 40) { index += dx < 0 ? 1 : -1; } dx = 0; apply(); startAuto(); };
    slidesWrap.addEventListener('mousedown', (e) => start(e.clientX));
    window.addEventListener('mousemove', (e) => move(e.clientX));
    window.addEventListener('mouseup', end);
    slidesWrap.addEventListener('touchstart', (e) => start(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchend', end);

    // Autoplay disabled
    const startAuto = () => {};
    const stopAuto = () => {};

    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto(); else startAuto();
    });

    window.addEventListener('resize', () => apply());
    updateDots();
    apply();
    if (ns === 'why') {
      const target = slider.closest('section') || slider;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) startAuto(); else stopAuto();
        });
      }, { threshold: 0.4 });
      obs.observe(target);
    } else {
      startAuto();
    }
  };

  initSlider('cap');
  initSlider('pricing');
  initSlider('why');
});

