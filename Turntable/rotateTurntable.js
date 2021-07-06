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

  let playState;

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

    handleInitalStatus(genericModal);
  }

  function handleInitalStatus(genericModal) {
    genericModal.remove();

    handleRotate();
    handleFadDblclick();
  }

  function handleContextMenu() {
    const configSwitchBtns = document.querySelectorAll("#popup-config-container button.switch");

    for (const configSwitch of configSwitchBtns) {
      configSwitch.addEventListener("click", handleConfigSwitch);
    }
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
