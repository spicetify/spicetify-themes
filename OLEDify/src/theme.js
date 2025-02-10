


/* eslint-disable no-param-reassign */
(function bloom() {
    function waitForElements(elementSelectors, func, attempts = 50) {
      const queries = elementSelectors.map((elementSelector) =>
        document.querySelector(elementSelector)
      );
      if (queries.every((element) => element)) {
        func(queries);
      } else if (attempts > 0) {
        setTimeout(waitForElements, 200, elementSelectors, func, attempts - 1);
      }
    }
  
    function injectScript(source) {
      const script = document.createElement("script");
      script.src = source;
      script.async = true;
      script.type = "text/javascript";
      document.head.appendChild(script);
    }
  
    function isObjectEmpty(object) {
      return Object.keys(object).length === 0;
    }
  
    const textColor = getComputedStyle(document.documentElement).getPropertyValue(
      "--spice-text"
    );
    if (textColor === " #000000") {
      document.documentElement.style.setProperty("--filter-brightness", 0);
    }
  
    const interval = setInterval(() => {
      function cleanLabel(label) {
        const cleanedLabel = label.replace(/[{0}{1}«»”“]/g, "").trim();
        return cleanedLabel;
      }
  
      const { Locale } = Spicetify;
      if (!Locale || isObjectEmpty(Locale.getDictionary())) return;
      clearInterval(interval);
  
      let playlistPlayLabel = Locale.get("playlist.a11y.play");
      playlistPlayLabel = cleanLabel(playlistPlayLabel);
      let playlistPauseLabel = Locale.get("playlist.a11y.pause");
      playlistPauseLabel = cleanLabel(playlistPauseLabel);
  
      const tracklistPlayLabel = Locale.get("tracklist.a11y.play");
      let tracklistPlayLabelOne;
      let tracklistPlayLabelTwo;
      if (["zh-CN", "zh-TW", "am", "fi"].includes(Locale.getLocale())) {
        [tracklistPlayLabelOne, tracklistPlayLabelTwo] =
          tracklistPlayLabel.split("{1}");
      } else {
        [tracklistPlayLabelOne, tracklistPlayLabelTwo] =
          tracklistPlayLabel.split("{0}");
      }
      tracklistPlayLabelOne = cleanLabel(tracklistPlayLabelOne);
      tracklistPlayLabelTwo = cleanLabel(tracklistPlayLabelTwo);
    }, 10);
  
    injectScript(
      "https://unpkg.com/fast-average-color/dist/index.browser.min.js"
    );
    injectScript(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.3/gsap.min.js"
    );
  
    const blur = 20;
    let lyricsObserver;
    const lyricsObserverConfig = { childList: true };
  
    // fixes container shifting & active line clipping
    function updateLyricsPageProperties() {
      function detectTextDirection() {
        // 0, 1 - blank lines
        const lyric = document.getElementsByClassName(
          "lyrics-lyricsContent-lyric"
        )[2];
        // https://stackoverflow.com/questions/13731909/how-to-detect-that-text-typed-in-text-area-is-rtl
        const rtlRegExp = /[\u0591-\u07FF]/;
        return rtlRegExp.test(lyric.innerHTML) ? "rtl" : "ltr";
      }
  
      function setLyricsTransformOrigin(textDirection) {
        const rootStyle = document.documentElement.style;
        if (textDirection === "rtl") {
          rootStyle.setProperty("--lyrics-text-direction", "right");
        } else {
          rootStyle.setProperty("--lyrics-text-direction", "left");
        }
      }
  
      function calculateLyricsMaxWidth(lyricsWrapper, lyricsContainer) {
        const offset =
          lyricsWrapper.offsetLeft +
          parseInt(window.getComputedStyle(lyricsWrapper).marginRight, 10);
        const maxWidth = Math.round(
          0.95 * (lyricsContainer.clientWidth - offset)
        );
        return maxWidth;
      }
  
      function lockLyricsWrapperWidth(lyricsWrapper) {
        const lyricsWrapperWidth = lyricsWrapper.getBoundingClientRect().width;
        lyricsWrapper.style.maxWidth = `${lyricsWrapperWidth}px`;
        lyricsWrapper.style.width = `${lyricsWrapperWidth}px`;
      }
  
      function revealLyricsLines() {
        const lyricsLines = Array.from(
          document.getElementsByClassName("lyrics-lyricsContent-lyric")
        );
        if (lyricsLines[0].style.animationName === "reveal") return;
        let positionIndex = 0;
        lyricsLines.forEach((lyricsLine) => {
          if (lyricsLine.innerHTML !== "") {
            positionIndex += 1;
          }
  
          let animationDelay = 50 + positionIndex * 10;
          if (animationDelay > 1000) {
            animationDelay = 1000;
          }
  
          let animationDuration = 200 + positionIndex * 100;
          if (animationDuration > 1000) {
            animationDuration = 1000;
          }
  
          lyricsLine.style.animationDelay = `${animationDelay}ms`;
          lyricsLine.style.animationDuration = `${animationDuration}ms`;
          lyricsLine.style.animationTimingFunction = "ease";
          lyricsLine.style.animationName = "reveal";
        });
      }
  
      function setLyricsPageProperties() {
        const lyricsContentWrapper = document.getElementsByClassName(
          "lyrics-lyrics-contentWrapper"
        )[0];
        const lyricsContentContainer = document.getElementsByClassName(
          "lyrics-lyrics-contentContainer"
        )[0];
  
        lyricsContentWrapper.style.maxWidth = "";
        lyricsContentWrapper.style.width = "";
  
        const lyricsTextDirection = detectTextDirection();
        setLyricsTransformOrigin(lyricsTextDirection);
        const lyricsMaxWidth = calculateLyricsMaxWidth(
          lyricsContentWrapper,
          lyricsContentContainer
        );
        lyricsContentWrapper.style.setProperty(
          "--lyrics-active-max-width",
          `${lyricsMaxWidth}px`
        );
        lockLyricsWrapperWidth(lyricsContentWrapper);
      }
  
      function lyricsCallback(mutationsList) {
        mutationsList.forEach((mutation) => {
          Array.from(mutation.addedNodes).forEach((addedNode) => {
            if (addedNode.classList?.contains("lyrics-lyricsContent-provider")) {
              setLyricsPageProperties();
              revealLyricsLines();
            }
          });
        });
      }
  
      waitForElements(
        [".lyrics-lyrics-contentContainer .lyrics-lyricsContent-provider"],
        () => {
          setLyricsPageProperties();
          revealLyricsLines();
        }
      );
  
      waitForElements(
        [".lyrics-lyrics-contentWrapper"],
        ([lyricsContentWrapper]) => {
          if (lyricsObserver instanceof MutationObserver) {
            lyricsObserver.disconnect();
          }
          lyricsObserver = new MutationObserver(lyricsCallback);
          lyricsObserver.observe(lyricsContentWrapper, lyricsObserverConfig);
        }
      );
    }
  
    function fillBackdrop(backdrop) {
      const context = backdrop.getContext("2d");
      const rootStyles = getComputedStyle(document.documentElement);
      const spiceMain = rootStyles
        .getPropertyValue("--spice-rgb-main")
        .split(",");
      context.fillStyle = `rgb(
        ${spiceMain[0].trim()},
        ${spiceMain[1]},
        ${spiceMain[2]}
        )`;
      context.fillRect(0, 0, backdrop.width, backdrop.height);
    }
  
    let previousAlbumUri;
  
    function updateLyricsBackdrop() {
      async function calculateBrightnessCoefficient(image) {
        const fac = new FastAverageColor();
  
        // ignore colors darker than 50% by HSB, because 0.5 is a brightness threshold
        const averageColor = await fac.getColorAsync(image, {
          ignoredColor: [0, 0, 0, 255, 125],
        });
  
        fac.destroy();
  
        // slice(0, 3) - remove alpha channel value
        let brightness = Math.max(...averageColor.value.slice(0, 3));
        brightness = (brightness / 255).toFixed(1);
  
        return brightness > 0.5 ? 1 - (brightness - 0.5) : 1;
      }
  
      async function calculateSaturationCoefficient(originalImage, canvasImage) {
        function getSaturation(color) {
          const { value } = color;
          const max = Math.max(...value.slice(0, 3));
          const min = Math.min(...value.slice(0, 3));
          const delta = max - min;
          return max !== 0 ? delta / max : 0;
        }
  
        const fac = new FastAverageColor();
  
        const [averageOriginalColor, averageCanvasColor] = await Promise.all([
          // ignore almost black colors
          fac.getColorAsync(originalImage, {
            ignoredColor: [0, 0, 0, 255, 10],
          }),
          fac.getColorAsync(canvasImage),
          { ignoredColor: [0, 0, 0, 255, 10] },
        ]);
  
        fac.destroy();
  
        const [averageOriginalSaturation, averageCanvasSaturation] = [
          getSaturation(averageOriginalColor),
          getSaturation(averageCanvasColor),
        ];
  
        let saturationCoefficient;
  
        if (averageCanvasSaturation < averageOriginalSaturation) {
          saturationCoefficient =
            averageOriginalSaturation / averageCanvasSaturation;
        } else {
          // do not change saturation if backdrop is more saturated than the original artwork or equal
          saturationCoefficient = 1;
        }
  
        const finalSaturation = (
          averageCanvasSaturation * saturationCoefficient
        ).toFixed(1);
  
        // try to detect and fix oversaturated backdrop
        if (finalSaturation > 0.8) {
          saturationCoefficient = 1 - (finalSaturation - 0.8);
        }
  
        // try to detect and fix undersaturated backdrop
        if (finalSaturation < 0.5 && averageOriginalSaturation > 0.05) {
          saturationCoefficient += 0.5 - finalSaturation;
        }
  
        // coefficient threshold
        if (saturationCoefficient > 1.7) {
          saturationCoefficient = 1.7;
        }
  
        return saturationCoefficient.toFixed(1);
      }
  
      // necessary because backdrop edges become transparent due to blurring
      function calculateContextDrawValues(canvas) {
        const drawWidth = canvas.width + blur * 2;
        const drawHeight = canvas.height + blur * 2;
        const drawX = 0 - blur;
        const drawY = 0 - blur;
        return [drawWidth, drawHeight, drawX, drawY];
      }
  
      function getImageFromCanvas(canvas) {
        const image = new Image();
        image.src = canvas.toDataURL();
        return image;
      }
  
      async function updateFilters(canvas, image) {
        const canvasImage = getImageFromCanvas(canvas);
        const [brightnessCoefficient, saturationCoefficient] = await Promise.all([
          calculateBrightnessCoefficient(canvasImage),
          calculateSaturationCoefficient(image, canvasImage),
        ]);
        // eslint-disable-next-line no-param-reassign
        canvas.style.filter = `saturate(${saturationCoefficient}) brightness(${brightnessCoefficient})`;
      }
  
      waitForElements(["#lyrics-backdrop"], ([lyricsBackdropPrevious]) => {
        // don't animate backdrop if artwork didn't change
        if (previousAlbumUri === Spicetify.Player.data.item.metadata.album_uri) {
          updateLyricsPageProperties();
          return;
        }
        previousAlbumUri = Spicetify.Player.data.item.metadata.album_uri;
  
        const contextPrevious = lyricsBackdropPrevious.getContext("2d");
        contextPrevious.globalCompositeOperation = "destination-out";
        contextPrevious.filter = `blur(${blur}px)`;
  
        const lyricsBackdrop = document.createElement("canvas");
        lyricsBackdrop.id = "lyrics-backdrop";
        fillBackdrop(lyricsBackdrop);
        lyricsBackdropPrevious.insertAdjacentElement(
          "beforebegin",
          lyricsBackdrop
        );
        const context = lyricsBackdrop.getContext("2d");
        context.imageSmoothingEnabled = false;
        context.filter = `blur(${blur}px)`;
  
        const lyricsBackdropImage = new Image();
        lyricsBackdropImage.src =
          Spicetify.Player.data.item.metadata.image_xlarge_url;
  
        lyricsBackdropImage.onload = () => {
          const [drawWidth, drawHeight, drawX, drawY] =
            calculateContextDrawValues(lyricsBackdrop);
          context.drawImage(
            lyricsBackdropImage,
            drawX,
            drawY,
            drawWidth,
            drawHeight
          );
          updateFilters(lyricsBackdrop, lyricsBackdropImage);
  
          const maxRadius = Math.ceil(
            Math.sqrt(
              lyricsBackdropPrevious.width ** 2 +
                lyricsBackdropPrevious.height ** 2
            ) / 2
          );
          const centerX = lyricsBackdropPrevious.width / 2;
          const centerY = lyricsBackdropPrevious.height / 2;
          const radius = { value: 0 };
  
          gsap.to(radius, {
            duration: 0.8,
            value: maxRadius,
            onUpdate: () => {
              contextPrevious.beginPath();
              contextPrevious.arc(centerX, centerY, radius.value, 0, Math.PI * 2);
              contextPrevious.closePath();
              contextPrevious.fill();
            },
            onComplete: () => {
              updateLyricsPageProperties();
              lyricsBackdropPrevious.remove();
            },
            ease: "sine.out",
          });
        };
      });
    }
  
    Spicetify.Player.addEventListener("songchange", updateLyricsBackdrop);
  
    function initLyricsBackdrop() {
      waitForElements([".under-main-view"], ([underMainView]) => {
        const lyricsBackdropContainer = document.createElement("div");
        lyricsBackdropContainer.id = "lyrics-backdrop-container";
        underMainView.prepend(lyricsBackdropContainer);
  
        const lyricsBackdrop = document.createElement("canvas");
        lyricsBackdrop.id = "lyrics-backdrop";
        lyricsBackdropContainer.appendChild(lyricsBackdrop);
  
        fillBackdrop(lyricsBackdrop);
        updateLyricsBackdrop();
      });
    }
  
    function addCategoryCardBackdrop() {
      waitForElements([".x-categoryCard-image"], () => {
        const cards = Array.from(
          document.querySelectorAll(".x-categoryCard-CategoryCard")
        );
        cards.forEach((card) => {
          const cardImage = card.querySelector(".x-categoryCard-image");
          if (
            card instanceof HTMLElement &&
            cardImage instanceof HTMLImageElement &&
            cardImage.previousElementSibling?.className !==
              "x-categoryCard-backdrop"
          ) {
            const cardBackdrop = document.createElement("div");
            cardBackdrop.classList.add("x-categoryCard-backdrop");
            cardBackdrop.style.backgroundImage = `url(${cardImage.src})`;
            cardBackdrop.style.backgroundColor = `${card.style.backgroundColor}`;
            cardImage.insertAdjacentElement("beforebegin", cardBackdrop);
          }
        });
      });
    }
  
    function keepCategoryCardBackdrops(currentPath) {
      if (currentPath === "/search") {
        addCategoryCardBackdrop();
      }
    }
  
    function handleLyricsStatus() {
      const lyricsBackdropContainer = document.querySelector(
        "#lyrics-backdrop-container"
      );
      const lyricsCinema = document.querySelector(".Root__lyrics-cinema");
      const isLyricsPage =
        Spicetify.Platform.History.location.pathname.includes("lyrics");
      const isLyricsCinemaVisible = lyricsCinema?.className.includes(
        "lyricsCinemaVisible"
      );
  
      if (isLyricsPage || isLyricsCinemaVisible) {
        if (!lyricsBackdropContainer) {
          initLyricsBackdrop();
        } else {
          lyricsBackdropContainer.style.display = "unset";
          updateLyricsPageProperties();
        }
      } else {
        if (lyricsBackdropContainer)
          lyricsBackdropContainer.style.display = "none";
      }
    }
  
    function waitForHistoryAPI(func, timeout = 100) {
      if (Spicetify.Platform?.History) {
        func();
      } else if (timeout > 0) {
        setTimeout(waitForHistoryAPI, 100, func, timeout - 1);
      }
    }
  
    waitForHistoryAPI(() => {
      Spicetify.Platform.History.listen(({ pathname }) => {
        keepCategoryCardBackdrops(pathname);
        handleLyricsStatus();
      });
  
      keepCategoryCardBackdrops(Spicetify.Platform.History.location.pathname);
      handleLyricsStatus();
  
      waitForElements([".Root__lyrics-cinema"], ([lyricsCinema]) => {
        const lyricsCinemaObserver = new MutationObserver(handleLyricsStatus);
        const lyricsCinemaObserverConfig = {
          attributes: true,
          attributeFilter: ["class"],
        };
        lyricsCinemaObserver.observe(lyricsCinema, lyricsCinemaObserverConfig);
      });
    });
  
    window.addEventListener("load", centerTopbar);
  
    function onResize() {
      centerTopbar();
      updateLyricsPageProperties();
    }
    window.addEventListener("resize", onResize);
  
    function keepNoiseOpacity() {
      if (Spicetify.Config.color_scheme.includes("light")) {
        document.documentElement.style.setProperty("--noise-opacity", "3.5%");
      } else {
        document.documentElement.style.setProperty("--noise-opacity", "7.5%");
      }
    }
    keepNoiseOpacity();
  
    waitForElements(["body"], ([body]) => {
      const bodyObserver = new MutationObserver(keepNoiseOpacity);
      const bodyObserverConfig = { childList: true };
      bodyObserver.observe(body, bodyObserverConfig);
      keepNoiseOpacity();
    });
  })();
  