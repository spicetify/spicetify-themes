window.addEventListener("load", rotateTurntable = () => {
  const SpicetifyOrigin = Spicetify.Player.origin;
  const fadBtn = document.querySelector(".main-topBar-button[title='Full App Display']");

  if (!SpicetifyOrigin?._state || !fadBtn) {
    setTimeout(rotateTurntable, 250);
    return;
  }

  const adModalStyle = document.createElement("style");
  const STYLE_FOR_AD_MODAL = `
.ReactModalPortal {
  display: none
}
`;
  adModalStyle.innerHTML = STYLE_FOR_AD_MODAL;

  const fadHeartContainer = document.createElement("div");
  const fadHeart = document.createElement("button");
  const fadHeartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  fadHeartContainer.classList.add("fad-heart-container");
  fadHeart.classList.add("fad-heart");
  fadHeartSvg.setAttribute("width", "16");
  fadHeartSvg.setAttribute("height", "16");
  fadHeartSvg.setAttribute("viewBox", "0 0 16 16");
  fadHeart.appendChild(fadHeartSvg);
  fadHeartContainer.appendChild(fadHeart);

  const songPreviewContainer = document.createElement("div");
  const previousSong = document.createElement("button");
  const nextSong = document.createElement("button");
  songPreviewContainer.classList.add("song-preview");
  songPreviewContainer.append(previousSong, nextSong);

  let isPlaying, clickedFadBtn;

  function handleRotate(eventType) {
    const coverArt = document.querySelector(".cover-art-image");
    const fadArt = document.querySelector("#fad-art-image");

    if (
      eventType == "load" && !SpicetifyOrigin._state.isPaused
      ||
      eventType == "playpause" && !isPlaying
      ||
      !eventType && isPlaying
    ) {
      coverArt.style.setProperty("animation-play-state", "running");
      fadArt?.style.setProperty("animation-play-state", "running");
      if (eventType) isPlaying = true;
    } else {
      coverArt.style.setProperty("animation-play-state", "paused");
      fadArt?.style.setProperty("animation-play-state", "paused");
      if (eventType) isPlaying = false;
    }
  }

  function handleFadBtn(event) {
    event.stopPropagation();
  }

  function handleFadControl() {
    const fadControlsBtns = document.querySelectorAll("#fad-controls button");

    for (const fadControl of fadControlsBtns) {
      fadControl.addEventListener("dblclick", handleFadBtn);
    }
  }

  function handleFadHeart(fromEvent) {
    const isFadHeartContainer = document.querySelector(".fad-heart-container");

    const stateItem = SpicetifyOrigin._state.item;

    if (stateItem.isLocal || stateItem.type == "ad") {
      isFadHeartContainer?.remove();
      return;
    }

    const fadFg = document.querySelector("#fad-foreground");

    const fadHeartState = Spicetify.Player.getHeart();

    if (!fromEvent && fadFg && !isFadHeartContainer) fadFg.appendChild(fadHeartContainer);

    if (!fromEvent && fadHeartState || fromEvent && !fadHeartState) {
      fadHeartSvg.innerHTML = Spicetify.SVGIcons["heart-active"];
      fadHeart.classList.add("checked");
    } else {
      fadHeartSvg.innerHTML = Spicetify.SVGIcons.heart;
      fadHeart.classList.remove("checked");
    }

    if (fromEvent) Spicetify.Player.toggleHeart();
  }

  function handleTracksNamePreview() {
    const prevTracks = Spicetify.Queue.prevTracks;
    const nextTracks = Spicetify.Queue.nextTracks;

    // let prevTracksIndexRefer = 1;
    // let nextTracksIndexRefer = 0;

    // while (
    //   prevTracks[prevTracks.length - prevTracksIndexRefer].metadata.hidden
    //   ||
    //   prevTracks[prevTracks.length - prevTracksIndexRefer].provider == "ad"
    // ) ++prevTracksIndexRefer;
    // previousSong.innerHTML = `&lt; ${prevTracks[prevTracks.length - prevTracksIndexRefer].metadata.title}`;

    // while (
    //   nextTracks[nextTracksIndexRefer].metadata.hidden
    //   ||
    //   nextTracks[nextTracksIndexRefer].provider == "ad"
    // ) ++nextTracksIndexRefer;
    // nextSong.innerHTML = `${nextTracks[nextTracksIndexRefer].metadata.title} &gt;`;

    trackCondition = element => !element.contextTrack.metadata.hidden && element.provider != "ad";

    const prevTrack = prevTracks.slice().reverse().find(trackCondition);
    previousSong.innerHTML = `&lt; ${prevTrack.contextTrack.metadata.title}`;

    const nextTrack = nextTracks.find(trackCondition);
    nextSong.innerHTML = `${nextTrack.contextTrack.metadata.title} &gt;`;
  }

  function handleConfigSwitch() {
    const fullAppDisplay = document.querySelector("#full-app-display");
    const fadFg = document.querySelector("#fad-foreground");
    const genericModal = document.querySelector("generic-modal");

    const stateItem = SpicetifyOrigin._state.item;

    if (!stateItem.isLocal && stateItem.type != "ad") fadFg.appendChild(fadHeartContainer);
    fullAppDisplay.appendChild(songPreviewContainer);

    genericModal.remove();

    handleRotate();
    handleFadControl();
  }

  function handleBackdrop(fullAppDisplay, setBlurBackdropBtn) {
    if (!+localStorage.getItem("enableBlurFad")) {
      fullAppDisplay.dataset.isBlurFad = "true";
      setBlurBackdropBtn.classList.remove("disabled");

      localStorage.setItem("enableBlurFad", "1");
    } else {
      fullAppDisplay.dataset.isBlurFad = "false";
      setBlurBackdropBtn.classList.add("disabled");

      localStorage.setItem("enableBlurFad", "0");
    }
  }

  function handleContextMenu(fullAppDisplay) {
    const configContainer = document.querySelector("#popup-config-container");
    const settingRowReferenceNode = document.querySelectorAll("#popup-config-container > div")[0];

    const settingRowContainer = document.createElement("div");
    const settingRow = `
<div class="setting-row">
  <label class="col description">Enable blur backdrop</label>
  <div class="col action">
    <button class="${+localStorage.getItem("enableBlurFad") ? "switch" : "switch disabled"}" data-blur-fad>
      <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.985 2.383L5.127 12.754 1.388 8.375l-.658.77 4.397 5.149 9.618-11.262z"></path>
      </svg>
    </button>
  </div>
</div>
`;
    settingRowContainer.innerHTML = settingRow;
    configContainer.insertBefore(settingRowContainer, settingRowReferenceNode);

    const configSwitchBtns = document.querySelectorAll("#popup-config-container button.switch");
    const setBlurBackdropBtn = document.querySelector("[data-blur-fad]");

    for (const configSwitch of configSwitchBtns) {
      configSwitch.addEventListener("click", handleConfigSwitch);
    }

    setBlurBackdropBtn.addEventListener("click", () => handleBackdrop(fullAppDisplay, setBlurBackdropBtn));
  }

  function handleMainInterface(fromActive, topbarContentFadeIn) {
    const mainInterface = document.querySelector("#main");
    const mainPlayBtn = document.querySelector(".main-playButton-PlayButton");
    const mainTopbarTitle = document.querySelector(".main-entityHeader-topbarTitle");
    const billboard = document.querySelector("#view-billboard-ad");

    if (fromActive) {
      if (!topbarContentFadeIn) {
        mainPlayBtn?.style.setProperty("opacity", "0", "important");
        mainTopbarTitle?.style.setProperty("opacity", "0", "important");
      }

      mainInterface.style.display = "none";
      document.body.append(adModalStyle);
    } else {
      mainInterface.style.display = "block";
      billboard?.closest(".ReactModalPortal").remove();
      adModalStyle.remove();

      setTimeout(() => {
        mainPlayBtn?.style.removeProperty("opacity");
        mainTopbarTitle?.style.removeProperty("opacity");
      }, 250);
    }
  }

  handleRotate("load");

  Spicetify.Player.addEventListener("onplaypause", () => handleRotate("playpause"));
  Spicetify.Player.addEventListener("songchange", () => {
    setTimeout(() => {
      handleRotate();
      handleFadHeart();
      handleTracksNamePreview();
    }, 500);
  });

  fadHeart.addEventListener("click", () => handleFadHeart(true));
  previousSong.addEventListener("click", () => SpicetifyOrigin.skipToPrevious());
  nextSong.addEventListener("click", () => SpicetifyOrigin.skipToNext());

  fadHeart.addEventListener("dblclick", handleFadBtn);
  previousSong.addEventListener("dblclick", handleFadBtn);
  nextSong.addEventListener("dblclick", handleFadBtn);

  fadBtn.addEventListener("click", () => {
    const topbarContentFadeIn = document.querySelector(".main-entityHeader-topbarContentFadeIn");
    const fullAppDisplay = document.querySelector("#full-app-display");

    if (!clickedFadBtn) {
      if (+localStorage.getItem("enableBlurFad")) fullAppDisplay.dataset.isBlurFad = "true";
      fullAppDisplay.appendChild(songPreviewContainer);

      // if (!songPreviewContainer.textContent.length) handleTracksNamePreview();
      handleFadControl();

      fullAppDisplay.addEventListener("contextmenu", () => handleContextMenu(fullAppDisplay), { once: true });

      fullAppDisplay.addEventListener("dblclick", () => handleMainInterface());

      clickedFadBtn = true;
    }

    handleMainInterface("active", topbarContentFadeIn);
    handleFadHeart();
    handleTracksNamePreview();
    handleRotate();
  });
});
