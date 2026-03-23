// theme.js — Dreamy Sea (Jellyfish Galaxy) for Spicetify
// Exact same structure as the starrynight sample theme.js
// Only the background animation is replaced with jellyfish canvas.
// Jellyfish opacity reduced slightly for a subtle effect.

function waitForElement(els, func, timeout = 100) {
  const queries = els.map((el) => document.querySelector(el));
  if (queries.every((a) => a)) {
    func(queries);
  } else if (timeout > 0) {
    setTimeout(waitForElement, 300, els, func, --timeout);
  }
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

waitForElement([".Root__top-container"], ([topContainer]) => {
  const r = document.documentElement;
  const rs = window.getComputedStyle(r);

  // ── Background container — same pattern as starrynight ──────
  const backgroundContainer = document.createElement("div");
  backgroundContainer.className = "dreamysea-bg-container";
  topContainer.appendChild(backgroundContainer);

  // Keep Spotify's z-index stack intact (same as starrynight)
  document.querySelector(".Root__top-container").style.zIndex = "0";

  // ── Canvas ──────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.id = "dreamysea-canvas";
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;display:block;";
  backgroundContainer.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let W = 0,
    H = 0;

  function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // ── Palette (mirrors color.ini) ─────────────────────────────
  const PAL = {
    bg_base: "#030b14",
    bg_horizon: "#0c1f3a",
    star_colors: [
      "#ffffff",
      "#fde047",
      "#a5f3fc",
      "#f9a8d4",
      "#c4b5fd",
      "#6ee7b7",
      "#fdba74",
    ],
    wisp_colors: [
      "rgba(123,63,160,0.12)",
      "rgba(196,71,138,0.10)",
      "rgba(6,182,212,0.08)",
      "rgba(139,92,246,0.11)",
      "rgba(45,212,191,0.07)",
      "rgba(196,71,138,0.07)",
    ],
    // ── Jellyfish palettes — opacity reduced slightly ──────────
    // body/rim/glow alpha values dialed down ~25% from before
    jellies: [
      {
        body: "rgba(103,232,249,0.12)", // was 0.18
        rim: "rgba(103,232,249,0.55)", // was 0.80
        glow: "rgba(6,182,212,0.35)", // was 0.55
        tentacle: "rgba(103,232,249,0.50)", // was 0.70
        parts: [
          "rgba(103,232,249,0.75)",
          "rgba(255,255,255,0.80)",
          "rgba(253,224,71,0.70)",
          "#a5f3fc",
        ],
      },
      {
        body: "rgba(168,85,212,0.14)", // was 0.20
        rim: "rgba(168,85,212,0.55)", // was 0.80
        glow: "rgba(139,92,246,0.35)", // was 0.55
        tentacle: "rgba(168,85,212,0.50)", // was 0.70
        parts: [
          "rgba(168,85,212,0.75)",
          "rgba(244,114,182,0.75)",
          "rgba(255,255,255,0.80)",
          "#c4b5fd",
        ],
      },
      {
        body: "rgba(224,117,176,0.12)", // was 0.18
        rim: "rgba(224,117,176,0.55)", // was 0.80
        glow: "rgba(236,72,153,0.32)", // was 0.50
        tentacle: "rgba(196,71,138,0.50)", // was 0.70
        parts: [
          "rgba(244,114,182,0.75)",
          "rgba(253,224,71,0.70)",
          "rgba(255,255,255,0.80)",
          "#f9a8d4",
        ],
      },
      {
        body: "rgba(45,212,191,0.12)", // was 0.17
        rim: "rgba(45,212,191,0.55)", // was 0.80
        glow: "rgba(15,118,110,0.35)", // was 0.55
        tentacle: "rgba(103,232,249,0.50)", // was 0.70
        parts: [
          "rgba(103,232,249,0.75)",
          "rgba(45,212,191,0.75)",
          "rgba(255,255,255,0.80)",
          "#a5f3fc",
        ],
      },
    ],
  };

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rand = (a, b) => Math.random() * (b - a) + a;
  const rgbOf = (rgba) => {
    const m = rgba.match(/[\d.]+/g);
    return m[0] + "," + m[1] + "," + m[2];
  };

  // ── Stars ────────────────────────────────────────────────────
  const stars = [];
  for (let i = 0; i < 300; i++) {
    const r = 0.35 + Math.random() * 1.9;
    stars.push({
      x: rand(0, window.innerWidth),
      y: rand(0, window.innerHeight),
      r,
      baseR: r,
      color: pick(PAL.star_colors),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.35, 1.9),
      glow: 2.5 + rand(0, 8),
    });
  }

  function drawStars(t) {
    stars.forEach((s) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const alpha = 0.28 + 0.65 * pulse;
      const glow = s.glow * pulse;
      const r = s.baseR * (0.65 + 0.55 * pulse);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = glow * 2.4;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (pulse > 0.82) {
        const len = glow * 1.8;
        ctx.globalAlpha = (pulse - 0.82) * 5 * alpha;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = r * 0.45;
        ctx.shadowBlur = glow * 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y);
        ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len);
        ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // ── Nebula wisps ─────────────────────────────────────────────
  const WISPS = [
    { nx: 0.12, ny: 0.28, rx: 0.32, ry: 0.22, sp: 0.1, ph: 0.0 },
    { nx: 0.8, ny: 0.17, rx: 0.28, ry: 0.19, sp: 0.13, ph: 1.2 },
    { nx: 0.5, ny: 0.65, rx: 0.38, ry: 0.25, sp: 0.08, ph: 2.5 },
    { nx: 0.88, ny: 0.6, rx: 0.24, ry: 0.17, sp: 0.11, ph: 0.8 },
    { nx: 0.2, ny: 0.8, rx: 0.28, ry: 0.17, sp: 0.09, ph: 1.9 },
    { nx: 0.55, ny: 0.15, rx: 0.22, ry: 0.14, sp: 0.12, ph: 3.0 },
  ];

  function drawWisps(t) {
    WISPS.forEach((w, i) => {
      const pulse = 0.68 + 0.32 * Math.sin(t * w.sp + w.ph);
      const cx = w.nx * W,
        cy = w.ny * H;
      const rx = w.rx * W * pulse,
        ry = w.ry * H * pulse;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0, PAL.wisp_colors[i]);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.scale(1, ry / rx);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy * (rx / ry), rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Particles ────────────────────────────────────────────────
  const particles = [];

  function burst(x, y, pal) {
    for (let i = 0; i < 5; i++) {
      const a = rand(0, Math.PI * 2),
        sp = rand(14, 45);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rand(6, 20),
        r: rand(0.8, 2.5),
        color: pick(pal.parts),
        life: 1.0,
        decay: rand(0.012, 0.018),
        glow: rand(3, 9),
      });
    }
  }

  function tickParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 7 * dt;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.life * 0.75; // slightly more transparent trails
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.glow;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Jellyfish ────────────────────────────────────────────────
  const jellies = [];
  let lastSpawn = 0;

  function mkJelly() {
    const pal = pick(PAL.jellies);
    const sz = rand(45, 115);
    const tc = 7 + Math.floor(rand(0, 6));
    const tents = [];
    for (let i = 0; i < tc; i++) {
      tents.push({
        angle: (i / tc) * Math.PI - Math.PI / 2 + rand(-0.2, 0.2),
        len: rand(sz * 0.9, sz * 2.8),
        wave: rand(0.45, 1.5),
        phase: rand(0, Math.PI * 2),
        w: rand(0.5, 1.8),
      });
    }
    return {
      x: rand(sz, W - sz),
      y: H + sz * 2,
      sz,
      speed: rand(42, 80),
      pal,
      wobOff: rand(0, Math.PI * 2),
      tents,
      lastP: 0,
      pulse: rand(0, Math.PI * 2),
      pulseS: rand(1.1, 2.4),
    };
  }

  function drawJelly(j, t) {
    const { x, y, sz, pal } = j;
    const p = 0.86 + 0.14 * Math.sin(t * j.pulseS + j.pulse);
    const R = sz * p;

    ctx.save();

    // halo — slightly lower opacity
    const hg = ctx.createRadialGradient(x, y, R * 0.35, x, y, R * 1.9);
    hg.addColorStop(0, pal.glow);
    hg.addColorStop(0.45, `rgba(${rgbOf(pal.glow)},0.10)`);
    hg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.82; // <-- global opacity cap on whole jelly
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(x, y, R * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // bell body
    ctx.beginPath();
    ctx.ellipse(x, y, R, R * 0.68, 0, Math.PI, 0, false);
    ctx.ellipse(x, y, R * 0.94, R * 0.23, 0, 0, Math.PI, false);
    ctx.closePath();
    const bg = ctx.createRadialGradient(x, y - R * 0.2, R * 0.06, x, y, R);
    bg.addColorStop(0, `rgba(${rgbOf(pal.rim)},0.32)`);
    bg.addColorStop(0.55, pal.body);
    bg.addColorStop(1, "rgba(0,0,0,0.02)");
    ctx.fillStyle = bg;
    ctx.shadowColor = pal.rim;
    ctx.shadowBlur = 20;
    ctx.fill();

    // rim ring
    ctx.beginPath();
    ctx.ellipse(x, y, R, R * 0.11, 0, 0, Math.PI * 2);
    ctx.strokeStyle = pal.rim;
    ctx.lineWidth = 1.6;
    ctx.shadowBlur = 12;
    ctx.stroke();

    // inner shine
    const sg = ctx.createRadialGradient(
      x - R * 0.22,
      y - R * 0.28,
      0,
      x,
      y,
      R * 0.75,
    );
    sg.addColorStop(0, "rgba(255,255,255,0.16)");
    sg.addColorStop(0.5, "rgba(255,255,255,0.03)");
    sg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sg;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(x, y, R * 0.7, R * 0.5, 0, Math.PI, 0, false);
    ctx.fill();

    // ribs
    for (let rb = 0; rb < 3; rb++) {
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        (R * (rb + 1)) / 5,
        R * 0.1 * (1 - rb * 0.15),
        0,
        Math.PI,
        0,
        false,
      );
      ctx.strokeStyle = `rgba(255,255,255,${0.03 + rb * 0.015})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.stroke();
    }

    // tentacles
    j.tents.forEach((ten) => {
      const tx0 = x + Math.cos(ten.angle) * R;
      const ty0 = y + Math.sin(ten.angle) * R * 0.24;
      ctx.beginPath();
      for (let s = 0; s <= 26; s++) {
        const f = s / 26;
        const wx =
          Math.sin(f * Math.PI * 2.6 * ten.wave + t * 2.3 + ten.phase) *
          R *
          0.26 *
          f;
        s === 0
          ? ctx.moveTo(tx0 + wx, ty0 + f * ten.len)
          : ctx.lineTo(tx0 + wx, ty0 + f * ten.len);
      }
      ctx.strokeStyle = pal.tentacle;
      ctx.globalAlpha = 0.38 + 0.24 * Math.sin(t * 1.9 + ten.phase); // reduced
      ctx.lineWidth = ten.w;
      ctx.shadowColor = pal.tentacle;
      ctx.shadowBlur = 6;
      ctx.lineCap = "round";
      ctx.stroke();

      // tip sparkle
      ctx.save();
      ctx.globalAlpha = (0.4 + 0.4 * Math.sin(t * 3 + ten.phase)) * 0.5;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = pal.rim;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(
        tx0 + Math.sin(ten.len * 0.05 + t) * R * 0.26,
        ty0 + ten.len,
        0.9,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    });

    // glitter dots
    ctx.globalAlpha = 0.82;
    for (let d = 0; d < 7; d++) {
      const da = (d / 7) * Math.PI + Math.PI;
      const dr = R * (0.28 + d * 0.05);
      const dotX = x + Math.cos(da) * Math.min(dr, R * 0.88);
      const dotY = y + Math.sin(da) * Math.min(dr, R * 0.88) * 0.62;
      const dp = 0.5 + 0.5 * Math.sin(t * 3.2 + d * 1.4 + j.pulse);
      ctx.save();
      ctx.globalAlpha = dp * 0.65; // reduced from 0.85
      ctx.fillStyle =
        d % 3 === 0 ? "#ffffff" : d % 3 === 1 ? pal.rim : "#fde047";
      ctx.shadowColor = d % 3 === 0 ? "#ffffff" : pal.rim;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function tickJellies(t, dt, now) {
    if (jellies.length < 7 && now - lastSpawn > 2800) {
      jellies.push(mkJelly());
      lastSpawn = now;
    }
    for (let i = jellies.length - 1; i >= 0; i--) {
      const j = jellies[i];
      j.x += Math.sin(t * 1.15 + j.wobOff) * 26 * dt;
      j.y -= j.speed * dt;
      if (now - j.lastP > 120) {
        burst(j.x, j.y + j.sz * 0.45, j.pal);
        burst(
          j.x + rand(-j.sz * 0.5, j.sz * 0.5),
          j.y + rand(j.sz * 0.5, j.sz * 2.5),
          j.pal,
        );
        j.lastP = now;
      }
      drawJelly(j, t);
      if (j.y < -j.sz * 4) jellies.splice(i, 1);
    }
  }

  // ── Main animation loop ──────────────────────────────────────
  let prevTime = null;

  function loop(now) {
    if (!prevTime) prevTime = now;
    const dt = Math.min((now - prevTime) / 1000, 0.05);
    const t = now / 1000;
    prevTime = now;

    ctx.clearRect(0, 0, W, H);

    // galaxy background
    const bgGrad = ctx.createLinearGradient(0, 0, W * 0.4, H);
    bgGrad.addColorStop(0, PAL.bg_base);
    bgGrad.addColorStop(0.5, PAL.bg_horizon);
    bgGrad.addColorStop(1, PAL.bg_base);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    drawWisps(t);
    drawStars(t);
    tickJellies(t, dt, now);
    tickParticles(dt);

    requestAnimationFrame(loop);
  }

  // Seed jellies spread across screen on startup
  for (let i = 0; i < 4; i++) {
    const j = mkJelly();
    j.y = H * (0.08 + i * 0.24);
    j.x = rand(80, W - 80);
    jellies.push(j);
  }
  lastSpawn = performance.now();
  requestAnimationFrame(loop);

  // ── Playbar width matching (same as starrynight) ─────────────
  const playbar = document.querySelector(".Root__now-playing-bar");
  waitForElement([".Root__right-sidebar"], ([rightbar]) => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === rightbar) {
          let newWidth = entry.contentRect.width;
          if (newWidth === 0) {
            const localStorageWidth = localStorage.getItem(
              "223ni6f2epqcidhx5etjafeai:panel-width-saved",
            );
            newWidth = localStorageWidth ? localStorageWidth : 420;
          }
          playbar.style.width = `${newWidth}px`;
          break;
        }
      }
    });
    resizeObserver.observe(rightbar);
  });

  // ── Cover art spin on play/pause (same as starrynight) ───────
  waitForElement(['[data-encore-id="buttonPrimary"]'], ([targetElement]) => {
    const playObserver = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "aria-label"
        ) {
          handleLabelChange();
        }
      }
    });
    playObserver.observe(targetElement, {
      attributes: true,
      attributeFilter: ["aria-label"],
    });
  });

  function handleLabelChange() {
    const img = document.querySelector(
      ".main-nowPlayingWidget-coverArt .cover-art img",
    );
    if (!img) return;
    if (
      document
        .querySelector('[data-encore-id="buttonPrimary"]')
        .getAttribute("aria-label") === "Pause"
    ) {
      img.classList.add("running-animation");
    } else {
      img.classList.remove("running-animation");
    }
  }
});
