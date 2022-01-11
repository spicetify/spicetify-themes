(function fluent() {

  function waitForElement(els, func, timeout = 10000) {
    const queries = els.map(el => document.querySelector(el));
    if (queries.every(a => a)) {
      func();
    } else if (timeout > 0) {
      setTimeout(waitForElement, 300, els, func, timeout--);
    }
  }

  waitForElement([
    ".main-rootlist-rootlistItemLink"
  ], function () {
    function replacePlaylistIcons() {
      const playListItems = document.getElementsByClassName("main-rootlist-rootlistItemLink");

      for (const item of playListItems) {
        const link = item.pathname;
        let uri;
        if (link.search("playlist") !== -1) {
          uri = Spicetify.URI.playlistV2URI(link.split("/").pop());
        } else if (link.search("folder") !== -1) {
          item.style.content = "url('./fluentui-system-icons/ic_fluent_folder_24_filled.svg')"
          continue;
        }

        Spicetify.CosmosAsync.get(
          `sp://core-playlist/v1/playlist/${uri.toString()}/metadata`, {
          policy: {
            picture: true
          }
        }
        ).then(res => {
          const meta = res.metadata;
          if (meta.picture === "") {
            item.style.content = "url('./fluentui-system-icons/ic_fluent_music_note_2_24_filled.svg')"
          } else {
            item.style.backgroundImage = "url(" + meta.picture + ")";
            item.style.content = "";
          }
        });
      };

    };

    replacePlaylistIcons();
    const observer = new MutationObserver(replacePlaylistIcons);
    waitForElement(["#spicetify-playlist-list"], () => {
      const rootList = document.querySelector("#spicetify-playlist-list");
      observer.observe(rootList, {
        childList: true,
        subtree: true
      });
    });
  });

  waitForElement([
    ".main-navBar-navBarLink",
    "[href='/collection'] > span"
  ], () => {
    const navBarItems = document.getElementsByClassName("main-navBar-navBarLink");
    for (const item of navBarItems) {
      let div = document.createElement("div");
      div.classList.add("navBar-navBarLink-accent");
      item.appendChild(div);
    }
    document.querySelector("[href='/collection'] > span").innerHTML = "Library";
  });

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-text');
  if (textColor == " #000000") {
    document.documentElement.style.setProperty('--filter-brightness', 0);
  }
    
  var interval = setInterval(function() {
    if (typeof Spicetify.Platform == 'undefined' || (typeof Spicetify.Platform.Translations.play == 'undefined' && typeof Spicetify.Platform.Translations.pause == 'undefined')) return;
      clearInterval(interval);
      var playButtonStyle = document.createElement('style');
      playButtonStyle.type = 'text/css';
      playButtonStyle.innerHTML = `
      .main-playButton-button[aria-label="${Spicetify.Platform.Translations.play}"],
      .main-playButton-PlayButton[aria-label="${Spicetify.Platform.Translations.play}"],
      .main-playPauseButton-button[aria-label="${Spicetify.Platform.Translations.play}"],
      .main-trackList-rowPlayPauseButton[aria-label="${Spicetify.Platform.Translations.play}"] {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('./fluentui-system-icons/ic_fluent_play_24_filled.svg') !important;
      }
      .main-playButton-button[aria-label="${Spicetify.Platform.Translations.pause}"],
      .main-playButton-PlayButton[aria-label="${Spicetify.Platform.Translations.pause}"],
      .main-playPauseButton-button[aria-label="${Spicetify.Platform.Translations.pause}"],
      .main-trackList-rowPlayPauseButton[aria-label="${Spicetify.Platform.Translations.pause}"] {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('./fluentui-system-icons/ic_fluent_pause_16_filled.svg') !important;
      }
      `;
      document.getElementsByTagName('head')[0].appendChild(playButtonStyle);
  }, 10)

  waitForElement([".progress-bar__slider"], () => {
    const sliders = document.getElementsByClassName("progress-bar__slider");
    for (const slider of sliders) {
      const dot = document.createElement("div");
      dot.classList.add("slider-dot");
      slider.appendChild(dot);
    }
  }, 10);
    
    
  waitForElement([".ExtraControls"], () => {
    const element = document.querySelector(".ExtraControls");
    element.addEventListener("click", () => {
      waitForElement([".npv-main-container .progress-bar__slider"], () => {
        const sliders = document.getElementsByClassName("npv-main-container")[0].getElementsByClassName("progress-bar__slider");
        for (const slider of sliders) {
          if(slider.dataset.dot === "true") { continue; }
          slider.dataset.dot = "true";
          const dot = document.createElement("div");
          dot.classList.add("slider-dot");
          slider.appendChild(dot);
        }
      }, 10)
    })
  }, 10);
})();
