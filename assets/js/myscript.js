// Initialize interactions after the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle (drawer)
  const mobileMenuButton = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileBackdrop = document.querySelector('.mobile-menu__backdrop');

  const setMobileState = (open) => {
    if (!mobileMenuButton || !mobileMenu) return;
    mobileMenu.classList.toggle('open', open);
    mobileMenuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) {
      mobileMenuButton.focus();
    }
  };

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('open');
      setMobileState(isOpen);
    });
  }
  // No backdrop click needed (compact dropdown)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) setMobileState(false);
  });

  // Smooth scrolling for in-page links
  // Mobile drawer: close then scroll to target
  document.querySelectorAll('a[href^="#"]:not([data-modal])').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href') || '';
      if (href === '#' || href.trim() === '') return;

      // If the link lives inside the mobile drawer, close and scroll
      const inMobileMenu = anchor.closest('#mobile-menu') || anchor.closest('.mobile-menu');
      if (inMobileMenu) {
        e.preventDefault();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        let target = null;
        try { target = document.querySelector(href); } catch (_) { target = null; }
        // Close via the centralized state setter
        setMobileState(false);
        // Sync nav indicator to this target immediately
        if (Array.isArray(navLinks)) {
          const navA = navLinks.find(a => (a.getAttribute('href') || '') === href);
          navA && setActiveLink(navA);
        }
        // Scroll after a short tick so layout settles
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            try { history.replaceState(null, '', href); } catch (_) {}
            if (href === '#services') {
              setTimeout(() => { target.classList.add('in-view'); }, 250);
            }
          }, 50);
        }
        return;
      }

      // For regular in-page links outside the mobile drawer, smooth scroll
      let target = null;
      try { target = document.querySelector(href); } catch (_) { target = null; }
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Sync nav indicator when clicking desktop nav links
        if (Array.isArray(navLinks)) {
          const navA = navLinks.find(a => (a.getAttribute('href') || '') === href);
          navA && setActiveLink(navA);
        }
        try { history.replaceState(null, '', href); } catch (_) {}
        if (mobileMenu) setMobileState(false);
        if (href === '#services') {
          setTimeout(() => { target.classList.add('in-view'); }, 250);
        }
      }
    });
  });

  // Keep header style constant on scroll (no scrolled state)
  const header = document.querySelector('.site-header');
  if (header) header.classList.remove('scrolled');

  // Pro nav indicator + active-link sync
  const navLinksWrap = document.querySelector('.nav-links');
  const navLinks = Array.from(document.querySelectorAll('.nav-links .nav-link'));
  const indicator = document.querySelector('.nav-indicator');

  const setActiveLink = (el) => {
    navLinks.forEach(a => a.classList.toggle('active', a === el));
    if (navLinksWrap && el && indicator) {
      const rect = el.getBoundingClientRect();
      const parent = navLinksWrap.getBoundingClientRect();
      const x = rect.left - parent.left;
      const w = rect.width;
      navLinksWrap.style.setProperty('--indicator-x', `${x}px`);
      navLinksWrap.style.setProperty('--indicator-w', `${w}px`);
    }
  };

  // Initialize indicator to current hash/first item
  if (navLinks.length) {
    const byHash = () => navLinks.find(a => a.getAttribute('href') === (location.hash || '#home')) || navLinks[0];
    setActiveLink(byHash());

    // Hover/focus moves indicator
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => setActiveLink(link));
      link.addEventListener('focus', () => setActiveLink(link));
    });
    // Mouse leaving the bar restores to section in view
    navLinksWrap && navLinksWrap.addEventListener('mouseleave', () => {
      const current = document.querySelector('.nav-link.active') || byHash();
      current && setActiveLink(current);
    });
    window.addEventListener('resize', () => {
      const current = document.querySelector('.nav-link.active') || byHash();
      current && setActiveLink(current);
    });
    // Sync indicator on URL hash changes (e.g., back/forward)
    window.addEventListener('hashchange', () => {
      const current = byHash();
      current && setActiveLink(current);
    });
  }

  // Active link by section in view
  if ('IntersectionObserver' in window && navLinks.length) {
    const map = new Map();
    navLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        try {
          const target = document.querySelector(href);
          if (target) map.set(target, a);
        } catch (_) {}
      }
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const a = map.get(entry.target);
          if (a) setActiveLink(a);
        }
      });
    }, { threshold: 0.6 });
    map.forEach((_, section) => observer.observe(section));
  }

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

  // Ensure delivery video autoplays inline on iOS
  const deliveryVideo = document.querySelector('.delivery-video');
  if (deliveryVideo) {
    try {
      deliveryVideo.muted = true;
      deliveryVideo.setAttribute('muted', '');
      deliveryVideo.setAttribute('playsinline', '');
      deliveryVideo.setAttribute('webkit-playsinline', '');
    } catch (_) {}
    const attemptPlay = () => {
      try {
        const p = deliveryVideo.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_) {}
    };
    // Try immediately and when visible
    attemptPlay();
    if ('IntersectionObserver' in window) {
      const section = deliveryVideo.closest('.delivery') || deliveryVideo;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) attemptPlay(); });
      }, { threshold: 0.2 });
      obs.observe(section);
    }
  }
});
// Mobile nav: close handler for full-screen overlay + auto-injected close button
(function () {
  function injectNavCloseButtons() {
    var containers = document.querySelectorAll('.nav-menu, .mobile-menu, .navbar-nav');
    containers.forEach(function (menu) {
      if (!menu.querySelector('.nav-close')) {
        var btn = document.createElement('button');
        btn.className = 'nav-close';
        btn.setAttribute('aria-label', 'Close menu');
        btn.type = 'button';
        btn.textContent = '\u00D7'; // ×
        menu.appendChild(btn);
      }
    });
  }
  function closeMobileNav() {
    var body = document.body;
    var header = document.querySelector('header');
    // Remove open flags on common containers
    var menus = document.querySelectorAll(
      '.nav-menu, .navbar-nav, .mobile-menu'
    );
    menus.forEach(function (el) {
      el.classList.remove('open');
      el.classList.remove('active');
      // If a toggler controls it via aria-expanded, reset it
      var togglerId = el.getAttribute('aria-labelledby');
      if (togglerId) {
        var tg = document.getElementById(togglerId);
        if (tg) tg.setAttribute('aria-expanded', 'false');
      }
    });

    // Clear body/header/nav open flags
    body.classList.remove('menu-open');
    body.classList.remove('nav-open');
    if (header) header.classList.remove('nav-open');
    var nav = document.querySelector('nav');
    if (nav) nav.classList.remove('open');
  }

  function bindNavCloseHandlers() {
    // Close button (×)
    document
      .querySelectorAll('.nav-menu .nav-close, .mobile-menu .nav-close, .navbar-nav .nav-close')
      .forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          closeMobileNav();
        });
      });

    // Close when clicking a link inside the mobile overlay
    document
      .querySelectorAll('.nav-menu a, .mobile-menu a, .navbar-nav a')
      .forEach(function (a) {
        a.addEventListener('click', function () {
          closeMobileNav();
        });
      });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectNavCloseButtons();
      bindNavCloseHandlers();
    });
  } else {
    injectNavCloseButtons();
    bindNavCloseHandlers();
  }
})();

// Backdrop disabled: ensure any injected .nav-backdrop is removed to keep white background only
(function () {
  function removeBackdrops() {
    document.querySelectorAll('.nav-backdrop').forEach(function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeBackdrops);
  } else {
    removeBackdrops();
  }
})();
// Enhanced mobile nav: backdrop + slide/fade close animation (non-invasive)
(function () {
  function ensureBackdrop() {
    var backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      document.body.appendChild(backdrop);
    }
    backdrop.addEventListener('click', function (e) {
      e.preventDefault();
      animatedClose();
    });
  }

  function animatedClose() {
    var body = document.body;
    var header = document.querySelector('header');
    var nav = document.querySelector('nav');
    var menus = document.querySelectorAll('.nav-menu, .mobile-menu, .navbar-nav');

    // Immediately hide any open menus, no visible flash
    menus.forEach(function (el) {
      if (el.classList.contains('open') || el.classList.contains('active')) {
        el.classList.add('closing');
        el.classList.remove('open');
        el.classList.remove('active');
        if (el.id === 'mobile-menu') {
          el.setAttribute('aria-hidden', 'true');
        }
      }
      var togglerId = el.getAttribute('aria-labelledby');
      if (togglerId) {
        var tg = document.getElementById(togglerId);
        if (tg) tg.setAttribute('aria-expanded', 'false');
      }
    });

    // Reset global open flags right away
    body.classList.remove('menu-open', 'nav-open');
    if (header) header.classList.remove('nav-open');
    if (nav) nav.classList.remove('open');

    // Clear transient 'closing' class shortly after (no visual change)
    setTimeout(function () {
      menus.forEach(function (el) { el.classList.remove('closing'); });
    }, 150);
  }

  function bindEnhancedHandlers() {
    // Intercept close button/link clicks in capture phase to run animated close
    var selectors = [
      '.nav-menu .nav-close',
      '.mobile-menu .nav-close',
      '.navbar-nav .nav-close',
      '.nav-menu a',
      '.mobile-menu a',
      '.navbar-nav a',
    ].join(',');
    document.querySelectorAll(selectors).forEach(function (el) {
      el.addEventListener(
        'click',
        function (e) {
          e.preventDefault();
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
          var href = (this && this.getAttribute) ? (this.getAttribute('href') || '') : '';
          var tgt = (this && this.getAttribute) ? (this.getAttribute('target') || '') : '';
          animatedClose();
          if (href && href.charAt(0) === '#') {
            try { history.replaceState(null, '', href); } catch (_) {}
            var target = null;
            try { target = document.querySelector(href); } catch (_) { target = null; }
            if (target) {
              setTimeout(function () {
                try {
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  // Best-effort: sync top nav indicator to this hash
                  var navWrap = document.querySelector('.nav-links');
                  var navLinksArr = Array.prototype.slice.call(document.querySelectorAll('.nav-links .nav-link'));
                  var indicatorEl = document.querySelector('.nav-indicator');
                  var match = navLinksArr.find(function (a) { return (a.getAttribute('href') || '') === href; });
                  if (match && navWrap && indicatorEl) {
                    navLinksArr.forEach(function (a) { a.classList.toggle('active', a === match); });
                    var rect = match.getBoundingClientRect();
                    var parent = navWrap.getBoundingClientRect();
                    var x = rect.left - parent.left;
                    var w = rect.width;
                    navWrap.style.setProperty('--indicator-x', x + 'px');
                    navWrap.style.setProperty('--indicator-w', w + 'px');
                  }
                } catch (_) {}
              }, 60); // short tick post-close, no flash
            }
          } else if (href) {
            // External link: navigate after close; honor target
            setTimeout(function () {
              try {
                if (tgt === '_blank') {
                  window.open(href, '_blank', 'noopener');
                } else {
                  window.location.href = href;
                }
              } catch (_) {}
            }, 10);
          }
        },
        { capture: true }
      );
    });

    // Close on Escape (capture)
    document.addEventListener(
      'keydown',
      function (e) {
        if (e.key === 'Escape') {
          if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
          animatedClose();
        }
      },
      { capture: true }
    );
  }

  function syncBodyOpenState() {
    var body = document.body;
    var isOpen = body.classList.contains('menu-open') || body.classList.contains('nav-open');
    if (!isOpen) {
      var header = document.querySelector('header');
      var nav = document.querySelector('nav');
      if ((header && header.classList.contains('nav-open')) || (nav && nav.classList.contains('open'))) {
        isOpen = true;
      }
    }
    if (!isOpen) {
      document.querySelectorAll('.nav-menu, .mobile-menu, .navbar-nav').forEach(function (el) {
        if (el.classList.contains('open') || el.classList.contains('active')) isOpen = true;
      });
    }
    body.classList.toggle('menu-open', isOpen);
  }

  function observeOpenState() {
    var observer = new MutationObserver(syncBodyOpenState);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    syncBodyOpenState();
  }

  function init() {
    ensureBackdrop();
    bindEnhancedHandlers();
    observeOpenState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
// Ensure nav merges cleanly between mobile and larger screens
;(function () {
  function resetNavForDesktop() {
    if (window.innerWidth < 768) return;
    var body = document.body;
    var header = document.querySelector('header');
    var nav = document.querySelector('nav');
    document.querySelectorAll('.nav-menu, .mobile-menu, .navbar-nav').forEach(function (el) {
      el.classList.remove('open', 'active', 'closing');
    });
    body.classList.remove('menu-open', 'nav-open');
    if (header) header.classList.remove('nav-open');
    if (nav) nav.classList.remove('open');
  }

  function onResize() {
    resetNavForDesktop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resetNavForDesktop);
  } else {
    resetNavForDesktop();
  }
  window.addEventListener('resize', onResize);
})();
