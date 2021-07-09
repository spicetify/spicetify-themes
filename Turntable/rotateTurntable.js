window.addEventListener("load", rotateTurntable = () => {
  const fadBtn = document.querySelector(".main-topBar-button[title='Full App Display']");

  if (!Spicetify.Player.origin || !fadBtn) {
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

  let playState, clickedFadBtn;

  function handleRotate(fromEvent) {
    const fadArt = document.querySelector("#fad-art-image");

    if (!fromEvent && Spicetify.Player.isPlaying() || fromEvent && !playState) {
      if (fadArt) fadArt.style.animationPlayState = "running";
      playState = true;
    } else {
      if (fadArt) fadArt.style.animationPlayState = "paused";
      playState = false;
    }
  }

  function handleFadDblclick() {
    const fadControlsBtns = document.querySelectorAll("#fad-controls button");

    for (const fadControl of fadControlsBtns) {
      fadControl.addEventListener("dblclick", event => event.stopPropagation());
    }
  }

  function handleConfigSwitch() {
    document.querySelector("generic-modal").remove();

    handleRotate();
    handleFadDblclick();
  }

  function handleBackdrop(fullAppDisplay, setBlurBackdropBtn) {
    if (!+localStorage.getItem("enableBlurFad")) {
      fullAppDisplay.setAttribute("data-is-blur-fad", "true");
      setBlurBackdropBtn.classList.remove("disabled");

      localStorage.setItem("enableBlurFad", "1");
    } else {
      fullAppDisplay.setAttribute("data-is-blur-fad", "false");
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

  function handleMainInterface() {
    const mainInterface = document.querySelector("#main");
    const mainPlayBtn = document.querySelector(".main-playButton-PlayButton");
    const mainTopbarTitle = document.querySelector(".main-entityHeader-topbarTitle");
    const billboard = document.querySelector("#view-billboard-ad");

    mainInterface.style.display = "block";
    if (billboard) billboard.closest(".ReactModalPortal").remove();
    adModalStyle.remove();

    setTimeout(() => {
      mainPlayBtn.style.removeProperty("opacity");
      if (mainTopbarTitle) mainTopbarTitle.style.removeProperty("opacity");
    }, 250);
  }

  handleRotate();

  Spicetify.Player.addEventListener("onplaypause", () => handleRotate(true));

  fadBtn.addEventListener("click", () => {
    const mainInterface = document.querySelector("#main");
    const mainPlayBtn = document.querySelector(".main-playButton-PlayButton");
    const mainTopbarTitle = document.querySelector(".main-entityHeader-topbarTitle");
    const topbarContentFadeIn = document.querySelector(".main-entityHeader-topbarContentFadeIn");
    const fullAppDisplay = document.querySelector("#full-app-display");
    const fadArt = document.querySelector("#fad-art-image");

    if (!clickedFadBtn) {
      if (+localStorage.getItem("enableBlurFad")) fullAppDisplay.setAttribute("data-is-blur-fad", "true");

      clickedFadBtn = true;
    }

    playState
      ? fadArt.style.animationPlayState = "running"
      : fadArt.style.animationPlayState = "paused";

    handleFadDblclick();

    if (!topbarContentFadeIn) {
      mainPlayBtn.style.setProperty("opacity", "0", "important");
      if (mainTopbarTitle) mainTopbarTitle.style.setProperty("opacity", "0", "important");
    }

    mainInterface.style.display = "none";
    document.body.append(adModalStyle);

    fullAppDisplay.addEventListener("contextmenu", () => {
      if (!document.querySelector("[data-blur-fad]")) handleContextMenu(fullAppDisplay);
    });

    fullAppDisplay.addEventListener("dblclick", handleMainInterface);
  });
});
