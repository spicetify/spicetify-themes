window.addEventListener("load", rotateTurntable = () => {
  const fadBtn = document.querySelector(".main-topBar-button[title='Full App Display']");

  if (!Spicetify.Player.origin || !fadBtn) {
    setTimeout(rotateTurntable, 250);
    return;
  }

  const adModalStyle = document.createElement("style");
  const STYLE_FOR_AD_MODAL =
`
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

  function handleFadControl(event) {
    event.stopPropagation();
  }

  function handleFadDblclick() {
    const fadControlsBtns = document.querySelectorAll("#fad-controls button");

    for (const fadControl of fadControlsBtns) {
      fadControl.addEventListener("dblclick", handleFadControl);
    }
  }

  function handleConfigSwitch() {
    const genericModal = document.querySelector("generic-modal");

    document.querySelectorAll("#popup-config-container > div")[0].remove();

    handleInitalStatus(genericModal);
  }

  function handleInitalStatus(genericModal) {
    genericModal.remove();

    handleRotate();
    handleFadDblclick();
  }

  function handleBackdrop() {
    const fadClassList = document.querySelector("#full-app-display").classList;

    if (!+localStorage.getItem("enableBlurFad")) {
      fadClassList.add("blur-fad");

      localStorage.setItem("enableBlurFad", "1");
    } else {
      fadClassList.remove("blur-fad");

      localStorage.setItem("enableBlurFad", "0");
    }
  }

  function handleContextMenu() {
    const configPopupCloseBtn = document.querySelector(".main-trackCreditsModal-closeBtn");
    const configContainer = document.querySelector("#popup-config-container");
    const settingRowReferenceNode = document.querySelectorAll("#popup-config-container > div")[0];

    const settingRowContainer = document.createElement("div");
    const settingRow =
`
<div class="setting-row">
  <label class="col description">Enable blur backdrop</label>
  <div class="col action">
    <button class="${+localStorage.getItem("enableBlurFad") ? "switch" : "switch disabled"}">
      <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.985 2.383L5.127 12.754 1.388 8.375l-.658.77 4.397 5.149 9.618-11.262z"></path>
      </svg>
    </button>
  </div>
</div>
`;

    settingRowContainer.innerHTML = settingRow;
    configContainer.insertBefore(settingRowContainer, settingRowReferenceNode);

    const setBlurBackdropNode = document.querySelectorAll("#popup-config-container > div")[0];
    const configSwitchBtns = document.querySelectorAll("#popup-config-container button.switch");

    configPopupCloseBtn.addEventListener("click", () => setBlurBackdropNode.remove());

    for (const configSwitch of configSwitchBtns) {
      configSwitch.addEventListener("click", handleConfigSwitch);
    }

    setBlurBackdropNode.querySelector("button").addEventListener("click", handleBackdrop);
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
    const fadClassList = document.querySelector("#full-app-display").classList;

    if (!clickedFadBtn && +localStorage.getItem("enableBlurFad")) fadClassList.add("blur-fad");
    if (!clickedFadBtn) clickedFadBtn = true;

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

    fullAppDisplay.addEventListener("contextmenu", handleContextMenu);

    fullAppDisplay.addEventListener("dblclick", handleMainInterface);
  });
});
