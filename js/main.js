/* ============================================================
   AR Digital Ad Studio — Main JavaScript
   Navigation, Animations, Testimonials, Accordion, Counter,
   Back to Top
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // ============================================================
  // 1. THEME TOGGLE (Dark ↔ Light)
  // ============================================================
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  // Restore saved theme
  const savedTheme = localStorage.getItem('ar-theme') || 'dark';
  body.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = body.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      body.setAttribute('data-theme', next);
      localStorage.setItem('ar-theme', next);
      updateThemeIcons(next);
      // Re-init Lucide icons to render new ones
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  function updateThemeIcons(theme) {
    document.querySelectorAll('.theme-icon-light').forEach(el => {
      el.style.display = theme === 'light' ? 'block' : 'none';
    });
    document.querySelectorAll('.theme-icon-dark').forEach(el => {
      el.style.display = theme === 'dark' ? 'block' : 'none';
    });
  }

  // ============================================================
  // 2. PRELOADER
  // ============================================================
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.classList.add('loaded');
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 700);
    });
    // Fallback: hide preloader after 3s
    setTimeout(() => {
      preloader.classList.add('loaded');
      setTimeout(() => { preloader.style.display = 'none'; }, 700);
    }, 3000);
  }

  // ============================================================
  // 3. NAVBAR SCROLL EFFECT
  // ============================================================
  const navbar = document.getElementById('navbar');
  const handleNavScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ============================================================
  // 4. MOBILE NAVIGATION
  // ============================================================
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ============================================================
  // 5. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
  // ============================================================
  const animatedElements = document.querySelectorAll('[data-animate]');
  const staggerElements = document.querySelectorAll('[data-animate-stagger]');

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  };

  const animObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        animObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => animObserver.observe(el));
  staggerElements.forEach(el => animObserver.observe(el));

  // ============================================================
  // 6. COUNTER ANIMATION
  // ============================================================
  const statNumbers = document.querySelectorAll('.stat-item__number[data-count]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.textContent.replace(/[0-9]/g, '').trim();
        let current = 0;
        const increment = Math.ceil(target / 60);
        const duration = 1500;
        const stepTime = duration / (target / increment);

        el.classList.add('counting');

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
            el.classList.remove('counting');
          }
          el.textContent = current + suffix;
        }, stepTime);

        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => counterObserver.observe(el));

  // Also trigger stat-item in-view for the pop animation
  const statItems = document.querySelectorAll('.stat-item');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  statItems.forEach(el => statObserver.observe(el));

  // ============================================================
  // 7. TESTIMONIALS SLIDER
  // ============================================================
  const track = document.getElementById('testimonialTrack');
  const dots = document.querySelectorAll('.testimonials__dot');
  let currentSlide = 0;

  function goToSlide(index) {
    if (!track) return;
    const cards = track.querySelectorAll('.testimonial-card');
    if (index < 0 || index >= cards.length) return;

    currentSlide = index;

    // Hide all, show current
    cards.forEach((card, i) => {
      card.style.display = i === currentSlide ? 'block' : 'none';
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  // Init testimonials
  if (track) {
    const cards = track.querySelectorAll('.testimonial-card');
    if (cards.length > 0) {
      track.style.display = 'block';
      goToSlide(0);
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goToSlide(parseInt(dot.getAttribute('data-index'), 10));
      });
    });

    // Auto-advance every 5s
    setInterval(() => {
      const cards = track.querySelectorAll('.testimonial-card');
      goToSlide((currentSlide + 1) % cards.length);
    }, 5000);
  }

  // ============================================================
  // 8. ACCORDION / FAQ
  // ============================================================
  const accordionTriggers = document.querySelectorAll('.accordion__trigger');

  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.parentElement;
      const isActive = item.classList.contains('active');

      // Close all in same accordion
      const accordion = item.parentElement;
      accordion.querySelectorAll('.accordion__item').forEach(el => {
        el.classList.remove('active');
      });

      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ============================================================
  // 9. BACK TO TOP BUTTON
  // ============================================================
  const backToTop = document.getElementById('backToTop');

  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================================
  // 10. SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;

      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ============================================================
  // 11. CONTACT FORM — fetch → /api/contact
  // ============================================================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameEl    = document.getElementById('contact-name');
      const emailEl   = document.getElementById('contact-email');
      const phoneEl   = document.getElementById('contact-phone');
      const serviceEl = document.getElementById('contact-service');
      const msgEl     = document.getElementById('contact-message');
      const btn       = contactForm.querySelector('button[type="submit"]');

      if (!nameEl.value.trim() || !emailEl.value.trim()) {
        showFormMsg(contactForm, 'error', 'Please fill in your name and email.');
        return;
      }

      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sending…</span>';
      btn.disabled = true;

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:    nameEl.value.trim(),
            email:   emailEl.value.trim(),
            phone:   phoneEl   ? phoneEl.value.trim()   : '',
            service: serviceEl ? serviceEl.value.trim() : '',
            message: msgEl     ? msgEl.value.trim()     : '',
          }),
        });

        const json = await res.json().catch(() => ({}));

        if (res.ok && json.ok) {
          btn.innerHTML = '✓ Message Sent!';
          btn.style.background = '#25D366';
          showFormMsg(contactForm, 'success', "We've received your message! Check your inbox — we'll be in touch within 24 hours.");
          contactForm.reset();
          setTimeout(() => {
            btn.innerHTML   = originalHTML;
            btn.style.background = '';
            btn.disabled    = false;
          }, 5000);
        } else {
          throw new Error(json.error || 'Something went wrong.');
        }
      } catch (err) {
        btn.innerHTML   = originalHTML;
        btn.disabled    = false;
        showFormMsg(contactForm, 'error', err.message || 'Could not send. Please call us directly: +91 92592 91668');
      }
    });
  }

  function showFormMsg(form, type, text) {
    let el = form.querySelector('.form-feedback');
    if (!el) {
      el = document.createElement('div');
      el.className = 'form-feedback';
      form.appendChild(el);
    }
    el.className = `form-feedback form-feedback--${type}`;
    el.textContent = text;
    el.style.cssText = `margin-top:14px;padding:13px 18px;border-radius:8px;font-size:14px;font-weight:500;line-height:1.5;${
      type === 'success'
        ? 'background:rgba(37,211,102,0.1);border:1px solid rgba(37,211,102,0.3);color:#25D366;'
        : 'background:rgba(255,80,80,0.1);border:1px solid rgba(255,80,80,0.3);color:#ff6b6b;'
    }`;
    setTimeout(() => { if (el.parentNode) el.remove(); }, 8000);
  }

  // ============================================================
  // 12. PAGE TRANSITION CLASS
  // ============================================================
  document.body.classList.add('page-transition');

  // ============================================================
  // 13. SCROLL PROGRESS BAR
  // ============================================================
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      scrollProgress.style.width = scrollPercent + '%';
    }, { passive: true });
  }

  // ============================================================
  // 14. HERO PARTICLES ANIMATION
  // ============================================================
  const heroParticles = document.getElementById('heroParticles');
  if (heroParticles) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('hero__particle');
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (6 + Math.random() * 6) + 's';
      particle.style.width = (2 + Math.random() * 4) + 'px';
      particle.style.height = particle.style.width;
      particle.style.opacity = Math.random() * 0.5;
      heroParticles.appendChild(particle);
    }
  }

  // ============================================================
  // 15. MAGNETIC BUTTON EFFECT
  // ============================================================
  const magneticBtns = document.querySelectorAll('.magnetic-btn');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });

  // ============================================================
  // 16. TILT EFFECT ON SERVICE CARDS
  // ============================================================
  const tiltCards = document.querySelectorAll('.service-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -4;
      const rotateY = (x - centerX) / centerX * 4;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

  // ============================================================
  // 17. SMOOTH NUMBER REVEAL FOR TIMELINE ITEMS
  // ============================================================
  const timelineItems = document.querySelectorAll('.timeline');
  timelineItems.forEach(timeline => {
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          timelineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    timelineObserver.observe(timeline);
  });

  // ============================================================
  // 18. RELEASE TIMELINE — SCROLL-ACTIVATED CARDS
  // ============================================================
  const releaseTimelines = document.querySelectorAll('.release-timeline');
  releaseTimelines.forEach(timeline => {
    const items = timeline.querySelectorAll('.release-timeline__item');
    if (!items.length) return;

    // Set first item active by default
    items[0].classList.add('active');

    const updateActiveItem = () => {
      const centerY = window.innerHeight / 3;
      let bestIndex = 0;
      let bestDist = Infinity;

      items.forEach((item, i) => {
        const rect = item.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - centerY);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      });

      items.forEach((item, i) => {
        if (i === bestIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    };

    window.addEventListener('scroll', updateActiveItem, { passive: true });
  });

  // ============================================================
  // 19. NAVBAR ACTIVE LINK BASED ON SCROLL POSITION
  // ============================================================
  const navLinks = document.querySelectorAll('.navbar__links a[href^="#"]');
  if (navLinks.length > 0) {
    const sections = [];
    navLinks.forEach(link => {
      const id = link.getAttribute('href');
      if (id && id.startsWith('#') && id !== '#') {
        const section = document.querySelector(id);
        if (section) sections.push({ el: section, link: link });
      }
    });

    if (sections.length > 0) {
      window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 100;
        sections.forEach(({ el, link }) => {
          if (el.offsetTop <= scrollPos && (el.offsetTop + el.offsetHeight) > scrollPos) {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      }, { passive: true });
    }
  }

});
