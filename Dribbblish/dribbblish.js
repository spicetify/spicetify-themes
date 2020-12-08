// Hide popover message
document.getElementById("popover-container").style.height = 0;

// Get stored hidden sidebar list
let appHiddenList = [];
try {
    const rawList = JSON.parse(localStorage.getItem("sidebar-app-hide-list"));
    if (!Array.isArray(rawList)) throw 0;
    appHiddenList.push(...rawList);
} catch {
    localStorage.setItem("sidebar-app-hide-list", "[]")
}

new Spicetify.ContextMenu.Item(
    "Hide",
    ([uri]) => {
        appHiddenList.push(uri.replace("spotify:special:sidebarapp:", ""));
        localStorage.setItem("sidebar-app-hide-list", JSON.stringify(appHiddenList));
        window.location.reload();
    },
    ([uri]) => uri.startsWith("spotify:special:sidebarapp:")
).register();

for (const app of appHiddenList) {
    new Spicetify.ContextMenu.Item(
        "Show " + app.replace("spotify:app:", ""),
        () => {
            appHiddenList = appHiddenList.filter(item => item !== app);
            localStorage.setItem("sidebar-app-hide-list", JSON.stringify(appHiddenList));
            window.location.reload();
        },
        ([uri]) => uri.startsWith("spotify:special:sidebarapp:")
    ).register();
}

function waitForElement(els, func, timeout = 100) {
    const queries = els.map(el => document.querySelector(el));
    if (queries.every(a => a)) {
        func(queries);
    } else if (timeout > 0) {
        setTimeout(waitForElement, 300, els, func, --timeout);
    }
}

// Add "Open User Profile" item in profile menu
new Spicetify.Menu.Item(window.__spotify.username, false, () => window.open(window.__spotify.userUri)).register();

waitForElement([".LeftSidebar", ".LeftSidebar__section--rootlist .SidebarList__list"], (queries) => {
    /** Replace Playlist name with their pictures */
    function loadPlaylistImage() {
        const sidebarItem = queries[1].childNodes;

        for (let i = 0; i < sidebarItem.length; i++) {
            const item = sidebarItem[i];
            let link = item.getElementsByTagName("a");
            if (!link || !link[0]) continue;
            link = link[0];

            let href = link.href.replace("app:", "");

            if (href.indexOf("playlist-folder") != -1) {
                const button = item.getElementsByTagName("button")[0]
                button.classList.add("Button", "Button--style-icon-background", "Button--size-28",);
                item.setAttribute("data-tooltip", item.innerText);
                link.firstChild.innerText = item.innerText.slice(0, 3);
                continue;
            }

            if (href.indexOf("chart") != -1) {
                href = href.replace("chart:", "user:spotifycharts:playlist:");
            }

            Spicetify.CosmosAPI.resolver.get({
                url: `sp://core-playlist/v1/playlist/${href}/metadata`,
                body: { policy: { picture: true } },
            }, (err, res) => {
                if (err) return;
                const meta = res.getJSONBody().metadata;
                item.firstChild.className = "playlist-picture"
                item.firstChild.style.backgroundImage = `url(${meta.picture})`;
                item.firstChild.setAttribute("data-tooltip", item.textContent);
            });
        }
    }

    loadPlaylistImage();

    new MutationObserver(loadPlaylistImage)
        .observe(queries[1], {childList: true});

    /** Replace Apps name with icons */

    /** List of avaiable icons to use:
    addfollow           filter          more                skipforward15
    addfollowers        flag            newradio            sort
    addsuggestedsong    follow          notifications       sortdown
    album               fullscreen      offline             sortup
    artist              gears           pause               spotifylogo
    attach              headphones      play                star
    block               heart           playlist            stations
    bluetooth           helpcircle      plus                subtitles
    browse              home            podcasts            tag
    camera              inbox           queue               time
    check               instagram       radio               track
    collection          lightning       refresh             trending
    copy                localfile       released            user
    devices             locked          repeat              video
    discover            lyrics          repeatonce          volume
    download            menu            search              watch
    downloaded          messages        share               x
    edit                mic             shuffle             helpcircle
    email               minimise        skip
    events              mix             skipback15
    */

    function replaceTextWithIcon(el, iconName) {
        const href = el.parentNode.href;
        if (appHiddenList.indexOf(href) !== -1) {
            let parent = el;
            while (parent.tagName !== "LI") {
                parent = parent.parentNode;
            }
            parent.remove();
            return;
        }

        if (iconName) {
            el.classList.add(`spoticon-${iconName}-24`);
        }

        el.parentNode.setAttribute("data-tooltip", el.innerText);
        el.parentNode.setAttribute("data-contextmenu", "");
        el.parentNode.setAttribute("data-uri", "spotify:special:sidebarapp:" + href);
        el.innerText = "";
    }

    queries[0].querySelectorAll(".LeftSidebar__section:not(.LeftSidebar__section--rootlist) [href]")
        .forEach(item => {
            let icon = ((app) => {switch (app) {
                case "genius":                  return "lyrics";
                case "JQBX":                    return "addsuggestedsong";
                case "bookmark":                return "tag";
                case "reddit":                  return "discover";
                case "made-for-you":            return "user";
                case "recently-played":         return "time";
                case "collection-songs":        return "collection";
                case "collection:albums":       return "album";
                case "collection:artists":      return "artist";
                case "collection:podcasts":     return "podcasts";
                case "playlist:local-files":    return "localfile";
                case "stations":                return "stations";
                /**
                 * Uncomment 3 lines below if you're using old version of Spotify that
                 * does not have Home/Browse/Radio app icons by default.
                 */
                //case "home":					return "home";
                //case "browse":	                return "browse";
                //case "radio":	                return "radio";
            }})(item.href.replace("spotify:app:", ""));

            replaceTextWithIcon(item.firstChild, icon);
        });

    waitForElement([`[href="spotify:app:recently-played"]`], ([query]) => {
        replaceTextWithIcon(query.firstChild, "time");
    });
});

waitForElement(["#search-input"], (queries) => {
    queries[0].setAttribute("placeholder", "");
});

waitForElement(["#main-container"], (queries) => {
    const shadow = document.createElement("div");
    shadow.id = "dribbblish-back-shadow";
    queries[0].prepend(shadow);
});

waitForElement([".LeftSidebar"], (queries) => {
    const fade = document.createElement("div");
    fade.id = "dribbblish-sidebar-fade-in";
    queries[0].append(fade);
});
