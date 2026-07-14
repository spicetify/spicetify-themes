window.addEventListener("load", rotateTurntable = () => {
  const SpicetifyOrigin = Spicetify.Player.origin;

  if (!SpicetifyOrigin?._state) {
    setTimeout(rotateTurntable, 250);
    return;
  }

  const BACKDROP_CONFIG_LABEL = "Enable blur backdrop";

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

  const fadArtistSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  fadArtistSvg.setAttribute("width", "16");
  fadArtistSvg.setAttribute("height", "16");
  fadArtistSvg.setAttribute("viewBox", "0 0 16 16");
  fadArtistSvg.setAttribute("fill", "currentColor");
  fadArtistSvg.innerHTML = Spicetify.SVGIcons.artist;
  const fadAlbumSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  fadAlbumSvg.setAttribute("width", "16");
  fadAlbumSvg.setAttribute("height", "16");
  fadAlbumSvg.setAttribute("viewBox", "0 0 16 16");
  fadAlbumSvg.setAttribute("fill", "currentColor");
  fadAlbumSvg.innerHTML = Spicetify.SVGIcons.album;

  let isFADReady = false;
  let isPlaying;

  function handleRotate(eventType) {
    if (eventType === "load" && !SpicetifyOrigin._state.item) return;

    const coverArt = document.querySelector(".main-nowPlayingWidget-coverArt > .cover-art");
    const fadArt = document.querySelector("#fad-art");

    if (
      eventType === "load" && !SpicetifyOrigin._state.isPaused
      ||
      eventType === "playpause" && !isPlaying
      ||
      !eventType && isPlaying
    ) {
      coverArt?.style.setProperty("animation-play-state", "running");
      fadArt?.style.setProperty("animation-play-state", "running");
      if (eventType) isPlaying = true;
    } else {
      coverArt?.style.setProperty("animation-play-state", "paused");
      fadArt?.style.setProperty("animation-play-state", "paused");
      if (eventType) isPlaying = false;
    }
  }

  function handleFadHeart() {
    const isFadHeartContainer = document.querySelector(".fad-heart-container");

    const stateItem = SpicetifyOrigin._state.item;

    if (stateItem.isLocal || stateItem.type === "ad") {
      isFadHeartContainer?.remove();
      return;
    }

    if (!isFadHeartContainer) document.querySelector("#fad-foreground")?.appendChild(fadHeartContainer);

    if (Spicetify.Player.getHeart()) {
      fadHeartSvg.innerHTML = Spicetify.SVGIcons["heart-active"];
      fadHeart.classList.add("checked");
    } else {
      fadHeartSvg.innerHTML = Spicetify.SVGIcons.heart;
      fadHeart.classList.remove("checked");
    }
  }

  function handleTracksNamePreview() {
    const prevTracks = Spicetify.Queue.prevTracks;
    const currentTrack = Spicetify.Queue.track;
    const nextTracks = Spicetify.Queue.nextTracks;

    trackCondition = element => !element.contextTrack.metadata.hidden && element.provider !== "ad";

    const prevTrack = prevTracks.slice().reverse().find(trackCondition);
    const nextTrack = nextTracks.find(trackCondition);

    const prevTrackTitle = prevTrack.contextTrack.metadata.title;
    const currentTrackTitle = currentTrack.contextTrack.metadata.title;
    const nextTrackTitle = nextTrack.contextTrack.metadata.title;

    if (currentTrackTitle === prevTrackTitle && currentTrackTitle === nextTrackTitle) {
      previousSong.innerHTML = "";
      nextSong.innerHTML = "";
    } else {
      previousSong.innerHTML = `&lt; ${prevTrackTitle}`;
      nextSong.innerHTML = `${nextTrackTitle} &gt;`;
    }
  }

  function handlePopupModalClick(event) {
    const { PopupModal } = Spicetify;
    const { target } = event;
    if (target.closest(".setting-row button.switch")) {
      PopupModal.hide();
      handleIcons();
    }
  }

  function handleFADBackdrop(event) {
    const { currentTarget } = event;
    const fullAppDisplay = document.querySelector("#full-app-display");
    if (!+localStorage.getItem("enableBlurFad")) {
      fullAppDisplay.dataset.isBlurFad = "true";
      currentTarget.classList.remove("disabled");
      localStorage.setItem("enableBlurFad", "1");
    } else {
      fullAppDisplay.dataset.isBlurFad = "false";
      currentTarget.classList.add("disabled");
      localStorage.setItem("enableBlurFad", "0");
    }
  }

  function handleIcons() {
    const iconsConfig = JSON.parse(localStorage.getItem("full-app-display-config")).icons;

    if (!iconsConfig) return;

    const isFadArtistSvg = document.querySelector("#fad-artist svg");
    const isFadAlbumSvg = document.querySelector("#fad-album svg");

    if (SpicetifyOrigin._state.item.type === "ad") {
      isFadArtistSvg?.remove();
      isFadAlbumSvg?.remove();

      return;
    }

    if (!isFadArtistSvg) {
      const fadArtist = document.querySelector("#fad-artist");
      const fadArtistTitle = document.querySelector("#fad-artist span");

      fadArtist?.insertBefore(fadArtistSvg, fadArtistTitle);
    }

    if (!isFadAlbumSvg) {
      const fadAlbum = document.querySelector("#fad-album");
      const fadAlbumTitle = document.querySelector("#fad-album span");

      fadAlbum?.insertBefore(fadAlbumSvg, fadAlbumTitle);
    }
  }

  function handleFADContextMenu() {
    const { PopupModal } = Spicetify;
    const configContainer = PopupModal.querySelector("main > div");
    const settingRow = document.createElement("div");
    settingRow.classList.add("setting-row");
    settingRow.innerHTML = `
<label class="col description">${BACKDROP_CONFIG_LABEL}</label>
<div class="col action">
  <button class="${+localStorage.getItem("enableBlurFad") ? "switch" : "switch disabled"}" data-blur-fad>
    ${parseIcon("check")}
  </button>
</div>
`;
    configContainer.insertBefore(
      settingRow,
      configContainer.querySelector(".setting-row")
    );
    const backdropConfigBtn = configContainer.querySelector("[data-blur-fad]");
    backdropConfigBtn.addEventListener("click", handleFADBackdrop);
  }

  function handleFADDblClick(event) {
    const { target } = event;
    if (target.closest("button")) {
      event.stopPropagation();
    }
  }

  // Todo
  function handleToggleFad(isActive) {
    if (isActive) {
      document.body.append(adModalStyle);
      return;
    }
    
    const billboard = document.querySelector("#view-billboard-ad");

    billboard?.closest(".ReactModalPortal").remove();
    adModalStyle.remove();
  }

  function handleFAD() {
    const fullAppDisplay = document.querySelector("#full-app-display");
    fullAppDisplay.appendChild(songPreviewContainer);
    if (+localStorage.getItem("enableBlurFad")) fullAppDisplay.dataset.isBlurFad = "true";
    document
      .querySelector("#fad-main")
      .addEventListener("contextmenu", handleFADContextMenu);
    fullAppDisplay.addEventListener("dblclick", handleFADDblClick);
    // fullAppDisplay.addEventListener("dblclick", () => handleToggleFad());
    // handleToggleFad(true);
    handleIcons();
    handleFadHeart();
    handleRotate();
  }

  function handleFADToggle() {
    if (!document.body.classList.contains("fad-activated")) {
      isFADReady = false;
      return;
    }
    if (isFADReady) return;
    handleFAD();
    isFADReady = true;
  }

  handleRotate("load");
  handleTracksNamePreview();

  Spicetify.Player.addEventListener("onplaypause", () => handleRotate("playpause"));
  Spicetify.Player.addEventListener("songchange", () => {
    setTimeout(() => {
      handleIcons();
      handleRotate();
    }, 500);
  });
  Spicetify.Player.origin._events.addListener("update", handleFadHeart);
  Spicetify.Player.origin._events.addListener("queue_update", handleTracksNamePreview);

  Spicetify.PopupModal.addEventListener("click", handlePopupModalClick);

  window.addEventListener("fad-request", handleFADToggle);

  fadHeart.addEventListener("click", Spicetify.Player.toggleHeart);
  previousSong.addEventListener("click", () => SpicetifyOrigin.skipToPrevious());
  nextSong.addEventListener("click", () => SpicetifyOrigin.skipToNext());
});
