window.addEventListener("load", () => {
  (function rotateTurntable() {
    if (!Spicetify.Player.origin || !document.querySelector("#fad-art-image")) {
      setTimeout(rotateTurntable, 250);
      return;
    }

    const fullAppDisplay = document.querySelector("#full-app-display");

    function handleRotate() {
      const fadArt = document.querySelector("#fad-art-image");

      Spicetify.Player.isPlaying()
        ? fadArt.style.animationPlayState = "running"
        : fadArt.style.animationPlayState = "paused";
    }

    handleRotate();

    Spicetify.Player.addEventListener("onplaypause", () => setTimeout(handleRotate));

    fullAppDisplay.addEventListener("contextmenu", () => {
      const configSwitchBtns = document.querySelectorAll("#popup-config-container button.switch");

      for (const configSwitch of configSwitchBtns) {
        configSwitch.addEventListener("click", handleRotate);
      }
    });
  })();
});
