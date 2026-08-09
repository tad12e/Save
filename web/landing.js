/* ══════════════════════════════════════════════════════════════
   CLIPPER — PREMIUM LANDING PAGE — DYNAMIC LOGIC
   Design Spec: Atlassian Teamwork Graph × Linear × Vercel × Raycast
   ══════════════════════════════════════════════════════════════ */

import { AuthState, signin, signup, verifyOTP, resendOTP } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. STICKY HEADER & SCROLL DETECT ───────────────────────── */
  const header = document.getElementById('header');

  function handleScroll() {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ── 2. MOBILE NAVIGATION HAMBURGER ────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileOverlay = document.getElementById('mobile-overlay');

  function toggleMobileNav() {
    const isOpen = mobileNav?.classList.contains('open');
    if (isOpen) {
      mobileNav?.classList.remove('open');
      mobileOverlay?.classList.remove('show');
      hamburger?.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      mobileNav?.classList.add('open');
      mobileOverlay?.classList.add('show');
      hamburger?.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  if (hamburger && mobileNav && mobileOverlay) {
    hamburger.addEventListener('click', toggleMobileNav);
    mobileOverlay.addEventListener('click', toggleMobileNav);

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (mobileNav.classList.contains('open')) toggleMobileNav();
      });
    });
  }

  /* ── 3. HERO PARTICLE CANVAS BACKGROUND ─────────────────────── */
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(Math.floor(width / 28), 40);

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 1.5 + 0.5;
        this.alpha = Math.random() * 0.3 + 0.05;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79, 140, 255, ${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(79, 140, 255, ${0.06 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animateParticles);
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animateParticles();
    }
  }

  /* ── 4. ECOSYSTEM ENERGY FLOW ANIMATION ENGINE ───────────────── */
  const sourceCards = document.querySelectorAll('.source-card');
  const aiCoreNode = document.getElementById('ai-core-node');
  const aiCoreBody = aiCoreNode?.querySelector('.core-glass-body');
  const coreStatusTag = document.getElementById('core-status-tag');

  const destSheets = document.getElementById('dest-sheets');
  const destNotion = document.getElementById('dest-notion');
  const destAirtable = document.getElementById('dest-airtable');
  const destCalendar = document.getElementById('dest-calendar');

  const destMap = {
    job: [destSheets, destNotion],
    event: [destSheets, destCalendar],
    article: [destNotion, destAirtable],
    scholarship: [destSheets, destCalendar],
    product: [destSheets, destAirtable]
  };

  const statusMap = {
    job: '✦ Parsing Job Metadata...',
    event: '✦ Extracting Event Date...',
    article: '✦ Generating AI Summary...',
    scholarship: '✦ Tracking Grant Deadline...',
    product: '✦ Extracting Product Deal...'
  };

  let activeCycleIndex = 0;
  let isUserHovering = false;
  let autoCycleTimer = null;

  function activateEcosystemFlow(sourceType) {
    // 1. Reset all highlights & lines
    document.querySelectorAll('.source-card, .dest-card').forEach(c => c.classList.remove('highlight'));
    document.querySelectorAll('.flow-line').forEach(l => l.classList.remove('active'));

    // 2. Highlight Source Card
    const sourceCard = document.getElementById(`card-${sourceType}`);
    sourceCard?.classList.add('highlight');

    // 3. Highlight Inflow Line
    const inLine = document.getElementById(`path-${sourceType}`);
    inLine?.classList.add('active');

    // 4. Activate AI Core Node
    aiCoreBody?.classList.add('active');
    if (coreStatusTag) coreStatusTag.textContent = statusMap[sourceType] || '✦ Classifying...';

    // 5. Highlight Outflow Lines & Dest Cards
    const targets = destMap[sourceType] || [destSheets, destNotion];
    targets.forEach(dest => {
      dest?.classList.add('highlight');
      const destId = dest.id.replace('dest-', '');
      const outLine = document.getElementById(`path-${destId}`);
      outLine?.classList.add('active');
    });
  }

  // Hover listeners on source cards
  sourceCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      isUserHovering = true;
      const sourceType = card.dataset.source;
      activateEcosystemFlow(sourceType);
    });

    card.addEventListener('mouseleave', () => {
      isUserHovering = false;
    });
  });

  // Auto-cycle ecosystem loop when idle
  function startAutoCycle() {
    const sources = ['job', 'event', 'article', 'scholarship', 'product'];
    autoCycleTimer = setInterval(() => {
      if (!isUserHovering) {
        activateEcosystemFlow(sources[activeCycleIndex]);
        activeCycleIndex = (activeCycleIndex + 1) % sources.length;
      }
    }, 2800);
  }

  // Initial trigger
  activateEcosystemFlow('job');
  startAutoCycle();

  /* ── 5. MARQUEE DUPLICATION ─────────────────────────────────── */
  const marqueeTrack = document.getElementById('marquee-track');
  if (marqueeTrack) {
    const items = Array.from(marqueeTrack.children);
    items.forEach(item => marqueeTrack.appendChild(item.cloneNode(true)));
  }

  /* ── 6. METRICS MATRIX NUMBER COUNTER ───────────────────────── */
  const metricNumbers = document.querySelectorAll('.lp-metric-number');
  const metricObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetStr = el.dataset.target;
        if (targetStr) {
          const target = parseInt(targetStr, 10);
          const hasPlus = el.textContent.includes('+');
          let start = 0;
          const duration = 1800;
          const startTime = performance.now();

          function updateCount(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * eased);
            el.textContent = current.toLocaleString() + (hasPlus ? '+' : '');
            if (progress < 1) requestAnimationFrame(updateCount);
          }
          requestAnimationFrame(updateCount);
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.2 });

  metricNumbers.forEach(el => metricObserver.observe(el));

  /* ── 7. KNOWLEDGE GRAPH — ORGANIC NETWORK ───────────────────── */
  const kgCanvas = document.getElementById('knowledge-canvas');
  if (kgCanvas) {
    const kgCtx = kgCanvas.getContext('2d');
    const kgContainer = document.getElementById('knowledge-graph');
    let kgW, kgH;
    const kgNodes = [];
    const kgEdges = [];
    const nodeCount = 55; // 40-70 nodes
    const nodeCategories = ['job', 'article', 'event', 'product', 'scholarship', 'tool'];
    const categoryColors = {
      job: 'rgba(79, 140, 255, 0.7)',
      article: 'rgba(139, 92, 246, 0.6)',
      event: 'rgba(250, 204, 21, 0.6)',
      product: 'rgba(34, 197, 94, 0.6)',
      scholarship: 'rgba(239, 68, 68, 0.5)',
      tool: 'rgba(79, 140, 255, 0.5)'
    };

    function resizeKG() {
      const rect = kgContainer.getBoundingClientRect();
      kgW = kgCanvas.width = rect.width;
      kgH = kgCanvas.height = rect.height;
    }

    function initKG() {
      resizeKG();
      kgNodes.length = 0;
      kgEdges.length = 0;

      // Create nodes with random placement
      for (let i = 0; i < nodeCount; i++) {
        const category = nodeCategories[Math.floor(Math.random() * nodeCategories.length)];
        kgNodes.push({
          x: Math.random() * kgW * 0.8 + kgW * 0.1,
          y: Math.random() * kgH * 0.8 + kgH * 0.1,
          radius: Math.random() * 4 + 2, // different node sizes
          category,
          color: categoryColors[category],
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          depth: Math.random(), // subtle depth
          phase: Math.random() * Math.PI * 2,
          floatSpeed: 6 + Math.random() * 4 // 6-10 seconds
        });
      }

      // Create varying-length edges (dotted connections)
      for (let i = 0; i < kgNodes.length; i++) {
        const connections = Math.floor(Math.random() * 3) + 1;
        for (let c = 0; c < connections; c++) {
          const j = Math.floor(Math.random() * kgNodes.length);
          if (i !== j) {
            const dist = Math.hypot(kgNodes[i].x - kgNodes[j].x, kgNodes[i].y - kgNodes[j].y);
            if (dist < kgW * 0.35) {
              kgEdges.push({ a: i, b: j, phase: Math.random() * Math.PI * 2 });
            }
          }
        }
      }
    }

    let kgTime = 0;

    function drawKG() {
      kgCtx.clearRect(0, 0, kgW, kgH);
      kgTime += 0.008;

      // Draw connection lines (dotted, slow opacity breathing — 12 seconds)
      kgEdges.forEach(edge => {
        const a = kgNodes[edge.a];
        const b = kgNodes[edge.b];
        const breathe = 0.15 + 0.2 * Math.sin(kgTime * (Math.PI * 2 / 12) + edge.phase);

        kgCtx.beginPath();
        kgCtx.setLineDash([3, 5]);
        kgCtx.moveTo(a.x, a.y);
        kgCtx.lineTo(b.x, b.y);
        kgCtx.strokeStyle = `rgba(255, 255, 255, ${breathe * 0.35})`;
        kgCtx.lineWidth = 0.5;
        kgCtx.stroke();
        kgCtx.setLineDash([]);
      });

      // Draw nodes (floating, different sizes, subtle depth)
      kgNodes.forEach(node => {
        // Floating animation: 6px, 6-10 seconds, ease-in-out
        const floatOffset = Math.sin(kgTime * (Math.PI * 2 / node.floatSpeed) + node.phase) * 6;
        const drawY = node.y + floatOffset;
        const depthScale = 0.6 + node.depth * 0.4;
        const r = node.radius * depthScale;

        // Glow pulse: opacity 15% -> 30% -> 15%
        const glowPulse = 0.15 + 0.15 * Math.sin(kgTime * 0.8 + node.phase);

        // Outer glow
        kgCtx.beginPath();
        kgCtx.arc(node.x, drawY, r + 4, 0, Math.PI * 2);
        kgCtx.fillStyle = node.color.replace(/[\d.]+\)$/, `${glowPulse * 0.5})`);
        kgCtx.fill();

        // Core dot
        kgCtx.beginPath();
        kgCtx.arc(node.x, drawY, r, 0, Math.PI * 2);
        kgCtx.fillStyle = node.color;
        kgCtx.fill();

        // Slow drift
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 20 || node.x > kgW - 20) node.vx *= -1;
        if (node.y < 20 || node.y > kgH - 20) node.vy *= -1;
      });

      requestAnimationFrame(drawKG);
    }

    // Vignette for knowledge graph edges
    function drawKGVignette() {
      const grad = kgCtx.createRadialGradient(kgW / 2, kgH / 2, kgW * 0.25, kgW / 2, kgH / 2, kgW * 0.55);
      grad.addColorStop(0, 'rgba(9, 9, 11, 0)');
      grad.addColorStop(1, 'rgba(9, 9, 11, 1)');
      kgCtx.fillStyle = grad;
      kgCtx.fillRect(0, 0, kgW, kgH);
    }

    initKG();
    window.addEventListener('resize', () => {
      resizeKG();
      // Re-place nodes proportionally
      kgNodes.forEach(node => {
        node.x = Math.min(Math.max(node.x, 20), kgW - 20);
        node.y = Math.min(Math.max(node.y, 20), kgH - 20);
      });
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawKG();
    }
  }

  /* ── 8. MOUSE PARALLAX (Max 12px) ───────────────────────────── */
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  const heroHeader = document.querySelector('.lp-hero-header');
  const heroGlow = document.querySelector('.lp-hero-glow');

  if (heroHeader && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * 12; // Max 12px
      targetY = ((e.clientY - cy) / cy) * 12;
    }, { passive: true });

    function updateParallax() {
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      heroHeader.style.transform = `translate(${mouseX * 0.3}px, ${mouseY * 0.3}px)`;
      if (heroGlow) {
        heroGlow.style.transform = `translate(calc(-50% + ${mouseX * 0.6}px), calc(-50% + ${mouseY * 0.6}px))`;
      }

      requestAnimationFrame(updateParallax);
    }
    updateParallax();
  }

  /* ── 9. LIVE DEMO TAB SWITCHER ───────────────────────────────── */
  const demoTabs = document.querySelectorAll('.lp-demo-tab');
  const demoPanels = document.querySelectorAll('.lp-demo-panel');

  demoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPanel = tab.dataset.tab;
      demoTabs.forEach(t => t.classList.remove('active'));
      demoPanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.lp-demo-panel[data-panel="${targetPanel}"]`)?.classList.add('active');
    });
  });

  /* ── 10. PRICING TOGGLE ───────────────────────────────────────── */
  const toggleSwitch = document.getElementById('toggle-switch');
  const toggleLabels = document.querySelectorAll('.lp-pricing-toggle .toggle-label');
  const proPrice = document.getElementById('pro-price');
  const proPeriod = document.getElementById('pro-period');
  let isYearly = false;

  function updatePricing() {
    if (isYearly) {
      toggleSwitch?.classList.add('yearly');
      toggleLabels[0]?.classList.remove('active');
      toggleLabels[1]?.classList.add('active');
      if (proPrice) proPrice.textContent = '$7';
      if (proPeriod) proPeriod.textContent = '/mo (billed yearly)';
    } else {
      toggleSwitch?.classList.remove('yearly');
      toggleLabels[0]?.classList.add('active');
      toggleLabels[1]?.classList.remove('active');
      if (proPrice) proPrice.textContent = '$9';
      if (proPeriod) proPeriod.textContent = '/mo';
    }
  }

  toggleSwitch?.addEventListener('click', () => { isYearly = !isYearly; updatePricing(); });
  toggleLabels.forEach(l => l.addEventListener('click', () => { isYearly = l.dataset.period === 'yearly'; updatePricing(); }));

  /* ── 11. FAQ ACCORDION ────────────────────────────────────────── */
  document.querySelectorAll('.lp-faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.lp-faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.lp-faq-item.open').forEach(o => { if (o !== item) o.classList.remove('open'); });
      if (isOpen) item.classList.remove('open');
      else item.classList.add('open');
    });
  /* ── 12. SCROLL REVEAL ───────────────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.lp-reveal').forEach((el) => revealObserver.observe(el));

  /* ── 13. AUTH MODAL INTERACTION & API SUBMISSIONS ───────────── */
  const modalOverlay = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('auth-close-btn');
  const viewSignin = document.getElementById('auth-view-signin');
  const viewSignup = document.getElementById('auth-view-signup');
  const viewOtp = document.getElementById('auth-view-otp');
  const gotoSignup = document.getElementById('goto-signup');
  const gotoSignin = document.getElementById('goto-signin');

  const signInBtns = [
    document.getElementById('sign-in-btn'),
    document.getElementById('get-started-btn'),
    document.getElementById('mobile-signin'),
    document.getElementById('mobile-getstarted'),
    document.getElementById('hero-cta-primary'),
    document.getElementById('pricing-free-btn'),
    document.getElementById('pricing-pro-btn'),
    document.getElementById('final-cta-btn')
  ];

  let pendingOtpEmail = '';
  let resendTimerInterval = null;

  // Toggle Password Visibility
  document.querySelectorAll('.lp-toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁️';
      }
    });
  });

  // 6-Pin OTP Input Handlers
  const pinInputs = Array.from(document.querySelectorAll('.lp-otp-pin-input'));
  const hiddenOtpInput = document.getElementById('otp-code');

  function updateHiddenOtp() {
    const code = pinInputs.map(i => i.value).join('');
    if (hiddenOtpInput) hiddenOtpInput.value = code;
    return code;
  }

  pinInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val;

      if (val && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }

      const code = updateHiddenOtp();
      if (code.length === 6) {
        const otpForm = document.getElementById('otp-form');
        otpForm?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        pinInputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').trim().replace(/[^0-9]/g, '');
      if (pasted) {
        const digits = pasted.slice(0, 6).split('');
        digits.forEach((digit, i) => {
          if (pinInputs[i]) pinInputs[i].value = digit;
        });
        const lastIndex = Math.min(digits.length, pinInputs.length) - 1;
        if (pinInputs[lastIndex]) pinInputs[lastIndex].focus();

        const code = updateHiddenOtp();
        if (code.length === 6) {
          const otpForm = document.getElementById('otp-form');
          otpForm?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    });
  });

  function resetOtpInputs() {
    pinInputs.forEach(i => i.value = '');
    if (hiddenOtpInput) hiddenOtpInput.value = '';
    setTimeout(() => pinInputs[0]?.focus(), 100);
  }

  function startResendCooldown(seconds = 60) {
    const resendBtn = document.getElementById('resend-otp-btn');
    const timerText = document.getElementById('resend-timer-text');
    if (!resendBtn || !timerText) return;

    resendBtn.style.pointerEvents = 'none';
    resendBtn.style.opacity = '0.5';
    timerText.style.display = 'inline';

    let remaining = seconds;
    timerText.textContent = `(${remaining}s)`;

    if (resendTimerInterval) clearInterval(resendTimerInterval);

    resendTimerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(resendTimerInterval);
        resendBtn.style.pointerEvents = 'auto';
        resendBtn.style.opacity = '1';
        timerText.style.display = 'none';
        resendBtn.textContent = 'Resend Code';
      } else {
        timerText.textContent = `(${remaining}s)`;
      }
    }, 1000);
  }

  function openAuthModal(defaultView = 'signin') {
    modalOverlay?.classList.add('open');
    switchAuthView(defaultView);
  }

  function closeAuthModal() {
    modalOverlay?.classList.remove('open');
  }

  function switchAuthView(viewName) {
    viewSignin?.classList.remove('active');
    viewSignup?.classList.remove('active');
    viewOtp?.classList.remove('active');

    if (viewName === 'signin') viewSignin?.classList.add('active');
    if (viewName === 'signup') viewSignup?.classList.add('active');
    if (viewName === 'otp') {
      viewOtp?.classList.add('active');
      resetOtpInputs();
      startResendCooldown(60);
    }
  }

  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.classList.add('show');
    }
  }

  function clearErrors() {
    document.querySelectorAll('.lp-auth-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('show');
    });
  }

  signInBtns.forEach(btn => {
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      const isSignupTrigger = btn.id === 'get-started-btn' || btn.id === 'hero-cta-primary' || btn.id === 'final-cta-btn' || btn.id === 'mobile-getstarted';
      openAuthModal(isSignupTrigger ? 'signup' : 'signin');
    });
  });

  closeBtn?.addEventListener('click', closeAuthModal);
  modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeAuthModal(); });

  gotoSignup?.addEventListener('click', (e) => { e.preventDefault(); clearErrors(); switchAuthView('signup'); });
  gotoSignin?.addEventListener('click', (e) => { e.preventDefault(); clearErrors(); switchAuthView('signin'); });

  if (AuthState.isAuthenticated()) {
    const signInNavBtn = document.getElementById('sign-in-btn');
    const getStartedNavBtn = document.getElementById('get-started-btn');
    const mobileSignin = document.getElementById('mobile-signin');
    const mobileGetStarted = document.getElementById('mobile-getstarted');

    if (signInNavBtn) {
      signInNavBtn.textContent = 'Dashboard';
      signInNavBtn.onclick = (e) => { e.preventDefault(); window.location.href = './index.html'; };
    }
    if (getStartedNavBtn) {
      getStartedNavBtn.textContent = 'Open Dashboard →';
      getStartedNavBtn.onclick = (e) => { e.preventDefault(); window.location.href = './index.html'; };
    }
    if (mobileSignin) {
      mobileSignin.textContent = 'Dashboard';
      mobileSignin.onclick = (e) => { e.preventDefault(); window.location.href = './index.html'; };
    }
    if (mobileGetStarted) {
      mobileGetStarted.textContent = 'Open Dashboard →';
      mobileGetStarted.onclick = (e) => { e.preventDefault(); window.location.href = './index.html'; };
    }
  }

  /* ── API SUBMISSIONS ── */
  const signinForm = document.getElementById('signin-form');
  signinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const submitBtn = document.getElementById('signin-submit-btn');

    try {
      submitBtn.textContent = 'Signing in...';
      submitBtn.disabled = true;
      await signin({ email, password });
      window.location.href = './index.html';
    } catch (err) {
      showError('signin-error', err.message || 'Invalid email or password.');
    } finally {
      submitBtn.textContent = 'Sign In';
      submitBtn.disabled = false;
    }
  });

  const signupForm = document.getElementById('signup-form');
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm_password = document.getElementById('signup-confirm-password').value;
    const submitBtn = document.getElementById('signup-submit-btn');

    if (password !== confirm_password) {
      showError('signup-error', 'Passwords do not match.');
      return;
    }

    try {
      submitBtn.textContent = 'Creating Account...';
      submitBtn.disabled = true;
      await signup({ name, email, password, confirm_password });
      pendingOtpEmail = email;
      const targetEmailEl = document.getElementById('otp-target-email');
      if (targetEmailEl) targetEmailEl.textContent = email;
      switchAuthView('otp');
    } catch (err) {
      showError('signup-error', err.message || 'Failed to create account.');
    } finally {
      submitBtn.textContent = 'Create Account';
      submitBtn.disabled = false;
    }
  });

  const otpForm = document.getElementById('otp-form');
  otpForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const otp = updateHiddenOtp();
    if (otp.length < 6) {
      showError('otp-error', 'Please enter all 6 digits of your verification code.');
      return;
    }
    const submitBtn = document.getElementById('otp-submit-btn');

    try {
      submitBtn.textContent = 'Verifying...';
      submitBtn.disabled = true;
      await verifyOTP({ email: pendingOtpEmail, otp });
      window.location.href = './index.html';
    } catch (err) {
      showError('otp-error', err.message || 'Invalid or expired OTP code.');
    } finally {
      submitBtn.textContent = 'Verify Code';
      submitBtn.disabled = false;
    }
  });

  const resendBtn = document.getElementById('resend-otp-btn');
  resendBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    clearErrors();
    try {
      resendBtn.textContent = 'Resending...';
      await resendOTP({ email: pendingOtpEmail });
      resendBtn.textContent = 'OTP Sent! ✓';
      setTimeout(() => { resendBtn.textContent = 'Resend OTP'; }, 3000);
    } catch (err) {
      showError('otp-error', err.message || 'Failed to resend OTP.');
      resendBtn.textContent = 'Resend OTP';
    }
  });

});
