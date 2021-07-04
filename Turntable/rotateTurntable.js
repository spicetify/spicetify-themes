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

  handleRotate();

  Spicetify.Player.addEventListener("onplaypause", () => handleRotate(true));

  fullAppDisplay.addEventListener("contextmenu", () => {
    const configSwitchBtns = document.querySelectorAll("#popup-config-container button.switch");

    for (const configSwitch of configSwitchBtns) {
      configSwitch.addEventListener("click", () => handleRotate());
    }
  });
});
