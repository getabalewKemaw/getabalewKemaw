(function () {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem('theme');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      const isDark = theme === 'dark';
      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.innerHTML = isDark ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
    }
  }

  // Initialize theme
  const initialTheme = savedTheme || (prefersDark.matches ? 'dark' : 'light');
  applyTheme(initialTheme);

  // Theme toggle
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('theme', next);
    });
  }

  // Scroll reveal
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.15 });
  revealEls.forEach((el) => observer.observe(el));

  // Tilt effect
  const tiltEls = Array.from(document.querySelectorAll('.tilt'));
  tiltEls.forEach((el) => {
    const bounds = () => el.getBoundingClientRect();
    let rafId = null;

    function onMove(e) {
      const b = bounds();
      const x = (e.clientX - b.left) / b.width; // 0..1
      const y = (e.clientY - b.top) / b.height; // 0..1
      const rx = (y - 0.5) * -10; // rotateX
      const ry = (x - 0.5) * 10;  // rotateY
      const glowX = `${x * 100}%`;
      const glowY = `${y * 100}%`;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        el.style.transition = 'transform 80ms ease-out';
        const glow = el.querySelector('.glow');
        if (glow) {
          glow.style.setProperty('--mx', glowX);
          glow.style.setProperty('--my', glowY);
        }
      });
    }

    function onLeave() {
      if (rafId) cancelAnimationFrame(rafId);
      el.style.transition = 'transform 400ms cubic-bezier(.2,.7,0,1)';
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  });

  // Mobile nav (basic no-op placeholder for future)
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const open = navLinks.getAttribute('data-open') === 'true';
      navLinks.setAttribute('data-open', String(!open));
      navLinks.style.display = open ? 'none' : 'flex';
    });
  }
})();
