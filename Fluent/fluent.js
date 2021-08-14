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
    ".main-rootlist-rootlistItemLink",
    "#spicetify-playlist-list"
  ], function() {

    function replacePlaylistIcons() {

      var els = document.getElementsByClassName("main-rootlist-rootlistItemLink");
      for (let i = 0; i < els.length; i++) {

        let link = els[i];
        let [_, app, uid] = link.pathname.split("/");
        let uri;
        if (app == "playlist") {
          uri = Spicetify.URI.playlistV2URI(uid);
        } else if (app == "folder") {
          link.style.content = "url(https://api.iconify.design/fluent/folder-24-regular.svg?color=%23bbb)"
          link.style.padding = "10px";
          continue;
        }

        Spicetify.CosmosAsync.get(
          `sp://core-playlist/v1/playlist/${uri.toURI()}/metadata`, {
            policy: {
              picture: true
            }
          }
        ).then(res => {
          const meta = res.metadata;
          if (meta.picture == "") {
            link.style.content = "url(https://api.iconify.design/fluent/music-note-2-24-regular.svg?color=%23bbb)"
            link.style.padding = "10px";
          } else {
            link.style.backgroundImage = "url(" + meta.picture + ")";
            link.style.content = "";
          }
        });

      }

    };

    replacePlaylistIcons();

    const observer = new MutationObserver(replacePlaylistIcons);
    const rootList = document.querySelector("#spicetify-playlist-list");
    observer.observe(rootList, {
      childList: true,
      subtree: true
    });

  });

  waitForElement([
    '.main-navBar-navBarLink',
    '[href="/collection"] > span'
  ], function() {
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--spice-accent').replace(" #", "");
    var icons = ["home", "search", "library"];
    var els = document.getElementsByClassName("main-navBar-navBarLink");
    for (let i = 0; i < els.length; i++) {
      let link = els[i];
      let div = document.createElement("div");
      div.classList.add("navBar-navBarLink-accent");
      link.appendChild(div);
    }
    document.querySelector('[href="/collection"] > span').innerHTML = "Library";
  });

  var text_color = getComputedStyle(document.documentElement).getPropertyValue('--spice-text');
  if (text_color == " #000000") {
    document.documentElement.style.setProperty('--filter-brightness', 0);
  }

})();
