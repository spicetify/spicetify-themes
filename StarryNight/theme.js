function waitForElement(els, func, timeout = 100) {
  const queries = els.map(el => document.querySelector(el));
  if (queries.every(a => a)) {
    func(queries);
  } else if (timeout > 0) {
    setTimeout(waitForElement, 300, els, func, --timeout);
  }
}

function random(min, max) { // min inclusive max exclusive
  return Math.random() * (max - min) + min;
}

waitForElement([".Root__top-container"], ([topContainer]) => {
  const r = document.documentElement;
  const rs = window.getComputedStyle(r);

  // make --spice-main transparent for a more visible background
  r.style.setProperty('--spice-main', rs.getPropertyValue('--spice-main') + '00');

  // to position stars and shooting stars between the background and everything else
  const rootElement = document.querySelector('.Root__top-container');
  rootElement.style.zIndex = '0';

  // create the stars
  const canvasSize = topContainer.clientWidth * topContainer.clientHeight;
  const starsFraction = canvasSize / 4000;
  for (let i = 0; i < starsFraction; i++) {
    const size = Math.random() < 0.5 ? 1 : 2;

    const star = document.createElement('div');
    star.style.position = 'absolute';
    star.style.left = random(0, 99) + '%';
    star.style.top = random(0, 99) + '%';
    star.style.opacity = random(0.5, 1);
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.backgroundColor = rs.getPropertyValue('--spice-star');
    star.style.zIndex = '-1';

    if (Math.random() < 1/5) {
      star.style.animation = 'twinkle' + (Math.floor(Math.random() * 4) + 1) + ' 5s infinite';
    }

    topContainer.appendChild(star);
  }

  /*
  Pure CSS Shooting Star Animation Effect Copyright (c) 2021 by Delroy Prithvi (https://codepen.io/delroyprithvi/pen/LYyJROR)

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */
  for (let i = 0; i < 4; i++) {
    const shootingstar = document.createElement('span');
    shootingstar.className = 'shootingstar';
    if (Math.random() < 0.75) {
      shootingstar.style.top = '-4px'; // hidden when animation is delayed 
      shootingstar.style.right = random(0, 90) + '%';
    } 
    else {
      shootingstar.style.top = random(0, 50) + '%';
      shootingstar.style.right = '-4px'; // hidden when animation is delayed 
    }

    const shootingStarGlowColor = "rgba(" + rs.getPropertyValue('--spice-rgb-shooting-star-glow') + "," + 0.1 + ')';
    shootingstar.style.boxShadow = "0 0 0 4px " + shootingStarGlowColor + ", 0 0 0 8px " + shootingStarGlowColor + ", 0 0 20px " + shootingStarGlowColor;
    
    shootingstar.style.animationDuration = Math.floor(Math.random() * (3)) + 3 + 's';
    shootingstar.style.animationDelay = Math.floor(Math.random() * 7) + 's';

    topContainer.appendChild(shootingstar);
  }
});



