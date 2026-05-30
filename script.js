/* Global utilities */
function getStoredTheme() {
  try {
    return localStorage.getItem("starlight-theme");
  } catch (_) {
    return null;
  }
}
function storeTheme(theme) {
  try {
    localStorage.setItem("starlight-theme", theme);
  } catch (_) {}
}

function applyInitialTheme() {
  const stored = getStoredTheme();
  if (stored === "light" || stored === "dark") {
    document.documentElement.setAttribute("data-theme", stored);
    return;
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
}

/* Scroll reveal */
function initScrollReveal() {
  const elementsToReveal = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    elementsToReveal.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });
  elementsToReveal.forEach(el => observer.observe(el));
}

/* Tilt effect */
function initTiltEffect() {
  const tiltElements = document.querySelectorAll("[data-tilt]");
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  tiltElements.forEach(el => {
    let rect = el.getBoundingClientRect();
    let currentX = 0, currentY = 0;
    const maxTilt = 10; // degrees
    const updateRect = () => { rect = el.getBoundingClientRect(); };

    const onMove = (ev) => {
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top) / rect.height;
      const tiltX = clamp((0.5 - y) * maxTilt * 2, -maxTilt, maxTilt);
      const tiltY = clamp((x - 0.5) * maxTilt * 2, -maxTilt, maxTilt);
      currentX = tiltX; currentY = tiltY;
      el.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    };

    const onLeave = () => {
      el.style.transform = "rotateX(0) rotateY(0)";
    };

    el.addEventListener("mouseenter", updateRect);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", updateRect, { passive: true });
    window.addEventListener("resize", updateRect);
  });
}

/* Smooth scroll for internal links */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.length > 1) {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

/* Theme toggle */
function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  btn?.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    storeTheme(next);
  });
}

/* Footer year */
function setYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear().toString();
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  applyInitialTheme();
  initScrollReveal();
  initTiltEffect();
  initSmoothScroll();
  initThemeToggle();
  setYear();
});
