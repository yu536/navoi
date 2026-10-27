(() => {
  const progressBar = document.getElementById('reading-progress-bar');
  const header = document.querySelector('.site-header');
  const menuButton = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const deckToggle = document.getElementById('deck-toggle');
  const deckToggleLabel = document.getElementById('deck-toggle-label');
  const deckControls = document.getElementById('deck-controls');
  const deckPrev = document.getElementById('deck-prev');
  const deckNext = document.getElementById('deck-next');
  const deckCounter = document.getElementById('deck-counter');
  const slides = Array.from(document.querySelectorAll('.deck-slide'));
  const navLinks = Array.from(document.querySelectorAll('.desktop-nav a, .mobile-nav a'));
  let deckMode = false;
  let activeSlide = 0;

  const updateProgress = () => {
    if (!progressBar) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  // The small-screen navigation remains keyboard and touch friendly.
  menuButton?.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    menuButton.textContent = isOpen ? '×' : '☰';
  });
  mobileNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
      if (menuButton) {
        menuButton.setAttribute('aria-label', 'Open navigation');
        menuButton.textContent = '☰';
      }
    });
  });

  // Reveal elements once as they enter the viewport; content stays visible without JS.
  const revealTargets = document.querySelectorAll('.fact, .timeline-event, .place-card, .person-card, .visit-reasons article, .source-list > a');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach((element) => element.classList.add('reveal'));
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  const updateDeckControls = () => {
    deckCounter.textContent = `${String(activeSlide + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    deckPrev.disabled = activeSlide === 0;
    deckNext.disabled = activeSlide === slides.length - 1;
  };

  const showSlide = (index) => {
    activeSlide = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeSlide;
      slide.classList.toggle('deck-active', active);
      slide.setAttribute('aria-hidden', deckMode && !active ? 'true' : 'false');
    });
    if (deckMode) {
      window.scrollTo(0, 0);
      updateDeckControls();
    }
  };

  const enterDeckMode = () => {
    // Read the user's current position before the deck stylesheet hides inactive sections.
    const current = slides.reduce((best, slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().top);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity });
    deckMode = true;
    document.body.classList.add('deck-mode');
    deckToggle.setAttribute('aria-pressed', 'true');
    deckToggleLabel.textContent = 'Exit deck';
    deckControls.hidden = false;
    document.querySelectorAll('.mobile-nav').forEach((nav) => nav.classList.remove('open'));
    // Start from the section closest to the user's current scroll position.
    showSlide(current.index);
  };

  const exitDeckMode = () => {
    const slideId = slides[activeSlide]?.id;
    deckMode = false;
    document.body.classList.remove('deck-mode');
    deckToggle.setAttribute('aria-pressed', 'false');
    deckToggleLabel.textContent = 'Present';
    deckControls.hidden = true;
    slides.forEach((slide) => {
      slide.classList.remove('deck-active');
      slide.removeAttribute('aria-hidden');
    });
    const returnTarget = slideId ? document.getElementById(slideId) : document.getElementById('top');
    window.scrollTo({ top: returnTarget ? returnTarget.offsetTop : 0, behavior: 'auto' });
    updateProgress();
  };

  deckToggle?.addEventListener('click', () => deckMode ? exitDeckMode() : enterDeckMode());
  deckPrev?.addEventListener('click', () => showSlide(activeSlide - 1));
  deckNext?.addEventListener('click', () => showSlide(activeSlide + 1));
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!deckMode) return;
      const targetId = link.getAttribute('href')?.slice(1);
      const targetIndex = slides.findIndex((slide) => slide.id === targetId);
      if (targetIndex >= 0) {
        event.preventDefault();
        showSlide(targetIndex);
      } else if (targetId === 'top') {
        event.preventDefault();
        showSlide(0);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (!deckMode) return;
    if (event.key === 'Escape') {
      exitDeckMode();
    } else if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      showSlide(activeSlide + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      showSlide(activeSlide - 1);
    } else if (event.key === 'Home') {
      showSlide(0);
    } else if (event.key === 'End') {
      showSlide(slides.length - 1);
    }
  });

  // If a visitor opens a fragment URL, allow the browser to scroll to it as usual.
  window.addEventListener('hashchange', updateProgress);
})();
