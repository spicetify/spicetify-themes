window.addEventListener("load", rotateTurntable = () => {
  const fadBtn = document.querySelector(".main-topBar-button[title='Full App Display']");

  if (!Spicetify.Player.origin || !fadBtn) {
    setTimeout(rotateTurntable, 250);
    return;
  }

  let playState;

  function handleRotate(fromEvent) {
    const fadArt = document.querySelector("#fad-art-image");

    if (!fromEvent && Spicetify.Player.isPlaying() || fromEvent && !playState) {
      fadArt && (fadArt.style.animationPlayState = "running");
      return playState = true;
    } else {
      fadArt && (fadArt.style.animationPlayState = "paused");
      return playState = false;
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

  handleRotate();

  Spicetify.Player.addEventListener("onplaypause", () => handleRotate(true));

  fadBtn.addEventListener("click", () => {
    const fullAppDisplay = document.querySelector("#full-app-display");
    const fadArt = document.querySelector("#fad-art-image");

    playState
      ? fadArt.style.animationPlayState = "running"
      : fadArt.style.animationPlayState = "paused";

    handleFadDblclick();

    fullAppDisplay.addEventListener("contextmenu", handleContextMenu);
  });
});
