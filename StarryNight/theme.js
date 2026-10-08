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

waitForElement(['.Root__top-container'], ([topContainer]) => {
  const r = document.documentElement;
  const rs = window.getComputedStyle(r);

  // Background container
  let backgroundContainer = document.querySelector('.starrynight-bg-container');
  if (!backgroundContainer) {
    backgroundContainer = document.createElement('div');
    backgroundContainer.className = 'starrynight-bg-container';
    topContainer.appendChild(backgroundContainer);
  } else {
    backgroundContainer.innerHTML = '';
  }

  const rootElement = document.querySelector('.Root__top-container');
  if (rootElement) {
    rootElement.style.zIndex = '0';
  }

  // 1. Original twinkling stars
  const canvasSize =
    backgroundContainer.clientWidth * backgroundContainer.clientHeight;
  const starsFraction = canvasSize / 4000;
  for (let i = 0; i < starsFraction; i++) {
    const size = Math.random() < 0.5 ? 1 : 2;

    const star = document.createElement('div');
    star.style.position = 'absolute';
    star.style.left = `${random(0, 99)}%`;
    star.style.top = `${random(0, 99)}%`;
    star.style.opacity = random(0.5, 1);
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.backgroundColor = rs.getPropertyValue('--spice-star');
    star.style.zIndex = '-1';
    star.style.borderRadius = '50%';

    if (Math.random() < 1 / 5) {
      star.style.setProperty(
        'animation',
        `twinkle${Math.floor(Math.random() * 4) + 1} 5s infinite`,
        'important'
      );
    }

    backgroundContainer.appendChild(star);
  }

  // 2. Original Delroy Prithvi shooting stars animation effect
  for (let i = 0; i < 4; i++) {
    const shootingstar = document.createElement('span');
    shootingstar.className = 'shootingstar';
    if (Math.random() < 0.75) {
      shootingstar.style.top = '-4px';
      shootingstar.style.right = `${random(0, 90)}%`;
    } else {
      shootingstar.style.top = `${random(0, 50)}%`;
      shootingstar.style.right = '-4px';
    }

    const shootingStarGlowColor = `rgba(${rs.getPropertyValue(
      '--spice-rgb-shooting-star-glow'
    )},0.1)`;
    shootingstar.style.boxShadow = `0 0 0 4px ${shootingStarGlowColor}, 0 0 0 8px ${shootingStarGlowColor}, 0 0 20px ${shootingStarGlowColor}`;

    const dur = `${Math.floor(Math.random() * 3) + 3}s`;
    const delay = `${Math.floor(Math.random() * 7)}s`;

    shootingstar.style.setProperty('animation', 'animate 3s linear', 'important');
    shootingstar.style.setProperty('animation-duration', dur, 'important');
    shootingstar.style.setProperty('animation-delay', delay, 'important');

    backgroundContainer.appendChild(shootingstar);

    shootingstar.addEventListener('animationend', () => {
      if (Math.random() < 0.75) {
        shootingstar.style.top = '-4px';
        shootingstar.style.right = `${random(0, 90)}%`;
      } else {
        shootingstar.style.top = `${random(0, 50)}%`;
        shootingstar.style.right = '-4px';
      }

      shootingstar.style.animation = 'none';
      void shootingstar.offsetWidth;
      shootingstar.style.setProperty('animation', 'animate 3s linear', 'important');
      shootingstar.style.setProperty(
        'animation-duration',
        `${Math.floor(Math.random() * 4) + 3}s`,
        'important'
      );
    });
  }

  // 3. Resize and collapse observer: when right sidebar collapses, collapse top playbar too!
  const setupResizeObserver = () => {
    const container = document.querySelector('.Root__top-container');
    if (!container) return;
    const rightSidebarSlot = [...container.children].find((el) => {
      try {
        return getComputedStyle(el).gridArea.includes('right-sidebar');
      } catch (e) {
        return false;
      }
    });

    if (rightSidebarSlot) {
      let rafPending = false;
      let lastWidth = -1;

      const updateWidth = (w) => {
        if (w === lastWidth) return;
        lastWidth = w;

        // When right sidebar is hidden or collapsed (< 200px)
        if (w < 200) {
          document.body.classList.add('starrynight-sidebar-collapsed');
          container.style.removeProperty('--starrynight-panel-width');
        } else {
          document.body.classList.remove('starrynight-sidebar-collapsed');
          container.style.setProperty('--starrynight-panel-width', `${w}px`);
        }
      };

      const ro = new ResizeObserver(([entry]) => {
        const w = Math.round(entry.contentRect.width);
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(() => {
            rafPending = false;
            updateWidth(w);
          });
        }
      });
      ro.observe(rightSidebarSlot);

      document.addEventListener('click', () => {
        setTimeout(() => {
          if (rightSidebarSlot) {
            updateWidth(Math.round(rightSidebarSlot.offsetWidth));
          }
        }, 150);
      });
    } else {
      setTimeout(setupResizeObserver, 500);
    }
  };
  setupResizeObserver();


  // 4. Handle play/pause state for spinning cover art
  const setupPlayStateObserver = () => {
    if (window.Spicetify && Spicetify.Player) {
      const updatePlaying = () => {
        const isPlaying = Spicetify.Player.isPlaying();
        if (isPlaying) {
          document.body.classList.add('starrynight-is-playing');
        } else {
          document.body.classList.remove('starrynight-is-playing');
        }
      };
      Spicetify.Player.addEventListener('onplaypause', updatePlaying);
      Spicetify.Player.addEventListener('songchange', () => setTimeout(updatePlaying, 100));
      updatePlaying();
    } else {
      setTimeout(setupPlayStateObserver, 300);
    }
  };
  setupPlayStateObserver();
});
