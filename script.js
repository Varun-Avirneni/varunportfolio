// Basic utilities
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

// Loader
window.addEventListener('load', () => {
  const loader = qs('#loader');
  if (loader) loader.style.display = 'none';
});

// Year
qs('#year').textContent = new Date().getFullYear();

// Smooth active link highlighting
const navLinks = qsa('header .nav-links a');
const sections = qsa('main section');
const activateLink = (id) => {
  navLinks.forEach((a) => a.classList.remove('active'));
  const link = qsa(`header .nav-links a[href="#${id}"]`)[0];
  if (link) link.classList.add('active');
};

const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) activateLink(entry.target.id);
    });
  },
  { rootMargin: '-50% 0px -40% 0px', threshold: 0.01 }
);
sections.forEach((s) => obs.observe(s));

// Reveal on scroll
const revealItems = qsa('[data-reveal]');
const revealObs = new IntersectionObserver(
  (entries, o) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        o.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
revealItems.forEach((el) => revealObs.observe(el));

// Custom cursor with trailing ease
(() => {
  const cursor = qs('#cursor');
  if (!cursor) return;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;
  const lerp = (a, b, n) => (1 - n) * a + n * b;
  const move = (e) => {
    tx = e.clientX;
    ty = e.clientY;
  };
  window.addEventListener('pointermove', move);
  const loop = () => {
    x = lerp(x, tx, 0.18);
    y = lerp(y, ty, 0.18);
    cursor.style.transform = `translate(${x - 8}px, ${y - 8}px)`;
    requestAnimationFrame(loop);
  };
  loop();
})();

// 3D tilt effect for cards
qsa('.tilt-card').forEach((card) => {
  let rect;
  const onEnter = () => {
    rect = card.getBoundingClientRect();
  };
  const onMove = (e) => {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y - rect.height / 2) / rect.height) * -10;
    const ry = ((x - rect.width / 2) / rect.width) * 10;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const onLeave = () => {
    card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
  };
  card.addEventListener('pointerenter', onEnter);
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerleave', onLeave);
});

// Background animated particles on canvas
(() => {
  const canvas = qs('#bg-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  const particles = [];
  const NUM = 80;
  const mouse = { x: -9999, y: -9999 };

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  };

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.4 * dpr;
      this.vy = (Math.random() - 0.5) * 0.4 * dpr;
      this.r = (Math.random() * 1.8 + 0.6) * dpr;
    }
    step() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
      // mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 80 * dpr) {
        const force = (80 * dpr - dist) / (80 * dpr);
        this.vx += (dx / (dist || 1)) * force * 0.6;
        this.vy += (dy / (dist || 1)) * force * 0.6;
      }
    }
    draw() {
      ctx.beginPath();
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      g.addColorStop(0, 'rgba(0,212,255,0.8)');
      g.addColorStop(1, 'rgba(0,255,136,0.0)');
      ctx.fillStyle = g;
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const init = () => {
    particles.length = 0;
    for (let i = 0; i < NUM; i++) particles.push(new Particle());
  };

  const loop = () => {
    ctx.clearRect(0, 0, w, h);
    // subtle gradient background overlay
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, 'rgba(0, 212, 255, 0.05)');
    bg.addColorStop(1, 'rgba(0, 255, 136, 0.03)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // connections
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.step();
      p.draw();
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = dx * dx + dy * dy;
        const max = 120 * dpr;
        if (dist < max * max) {
          const alpha = 1 - dist / (max * max);
          ctx.strokeStyle = `rgba(0, 212, 255, ${alpha * 0.15})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(loop);
  };

  window.addEventListener('resize', () => {
    resize();
    init();
  });
  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX * dpr;
    mouse.y = e.clientY * dpr;
  });
  resize();
  init();
  loop();
})();

// Basic contact form handler (no backend) — opens mail client as fallback
qs('#contact-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = qs('#name').value.trim();
  const email = qs('#email').value.trim();
  const message = qs('#message').value.trim();
  const subject = encodeURIComponent(`Portfolio Contact — ${name}`);
  const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`);
  window.location.href = `mailto:avirnenivarun1@gmail.com?subject=${subject}&body=${body}`;
});


