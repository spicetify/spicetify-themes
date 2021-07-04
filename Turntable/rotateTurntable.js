window.addEventListener("load", rotateTurntable = () => {
  if (!Spicetify.Player.origin || !document.querySelector("#fad-art-image")) {
    setTimeout(rotateTurntable, 250);
    return;
  }

  const fullAppDisplay = document.querySelector("#full-app-display");

  let playState;

  function handleRotate(fromEvent) {
    const fadArt = document.querySelector("#fad-art-image");

    if (!fromEvent && Spicetify.Player.isPlaying() || fromEvent && !playState) {
      fadArt.style.animationPlayState = "running";
      return playState = true;
    } else {
      fadArt.style.animationPlayState = "paused";
      return playState = false;
    }
  }

  function handleFadDblclick() {
    const fadControlsBtns = document.querySelectorAll("#fad-controls button");

    for (const fadControl of fadControlsBtns) {
      fadControl.addEventListener("dblclick", event => event.stopPropagation());
    }
  }

  function handleInitalStatus(genericModal) {
    if (genericModal) {
      genericModal.remove();
    }

    handleRotate();
    handleFadDblclick();
  }

  handleInitalStatus();

  Spicetify.Player.addEventListener("onplaypause", () => handleRotate(true));

  fullAppDisplay.addEventListener("contextmenu", () => {
    const genericModal = document.querySelector("generic-modal");
    const configSwitchBtns = document.querySelectorAll("#popup-config-container button.switch");

    for (const configSwitch of configSwitchBtns) {
      configSwitch.addEventListener("click", () => handleInitalStatus(genericModal));
    }
  });
});
