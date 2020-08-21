// Hide popover message
document.getElementById("popover-container").style.height = 0;

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
        if (iconName) {
            el.classList.add(`spoticon-${iconName}-24`);
        }

        el.parentNode.setAttribute("data-tooltip", el.innerText);
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

function getAlbumInfo(uri) {
    return new Promise((resolve) => { Spicetify.CosmosAPI.resolver.get(`hm://album/v1/album-app/album/${uri}/desktop`, (err, raw) => {
        resolve(!err && raw.getJSONBody())
    })})
}

var nearTrackSpan = null
var nearArtistSpan = null
var mainColor = getComputedStyle(document.documentElement).getPropertyValue('--modspotify_main_fg')
var lastDoc = null

waitForElement([".track"], (queries) => {
    nearTrackSpan = document.createElement("span");
    nearTrackSpan.id = "dribbblish-track-info";
    queries[0].append(nearTrackSpan);
});

waitForElement([".artist"], (queries) => {
    nearArtistSpan = document.createElement("span");
    nearArtistSpan.id = "dribbblish-album-info";
    queries[0].append(nearArtistSpan);
});

function hexToRgb(hex) {
    var bigint = parseInt(hex.replace("#",""), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return r + "," + g + "," + b;
}

function LightenDarkenColor(col, amt) {
  var num = parseInt(col, 16);
  var r = (num >> 16) + amt;
  var b = ((num >> 8) & 0x00FF) + amt;
  var g = (num & 0x0000FF) + amt;
  var newColor = g | (b << 8) | (r << 16);
  return '#'+newColor.toString(16);
}

function updateColors(root) {
    colHex = mainColor
    colRGB = hexToRgb(colHex)
    darkerColHex = LightenDarkenColor(colHex, -40)
    darkerColRGB = hexToRgb(darkerColHex)

    root.style.setProperty('--modspotify_main_fg', colHex)
    root.style.setProperty('--modspotify_active_control_fg', colHex)
    root.style.setProperty('--modspotify_secondary_bg', colHex)
    root.style.setProperty('--modspotify_active_control_fg', colHex)
    //root.style.setProperty('--modspotify_pressing_button_bg', colHex)
    //root.style.setProperty('--modspotify_indicator_fg_and_button_bg', colHex)
    root.style.setProperty('--modspotify_pressing_fg', colHex)
    root.style.setProperty('--modspotify_sidebar_indicator_and_hover_button_bg', colHex)
    //root.style.setProperty('--modspotify_scrollbar_fg_and_selected_row_bg', darkerColHex)
    root.style.setProperty('--modspotify_selected_button', darkerColHex)
    //root.style.setProperty('--modspotify_miscellaneous_hover_bg', colHex)
    
    root.style.setProperty('--modspotify_rgb_main_fg', colRGB)
    root.style.setProperty('--modspotify_rgb_active_control_fgg', colRGB)
    root.style.setProperty('--modspotify_rgb_secondary_bg', colRGB)
    root.style.setProperty('--modspotify_rgb_active_control_fg', colRGB)
    //root.style.setProperty('--modspotify_rgb_pressing_button_bg', colRGB)
    //root.style.setProperty('--modspotify_rgb_indicator_fg_and_button_bg', colRGB)    
    root.style.setProperty('--modspotify_rgb_pressing_fg', colRGB)
    root.style.setProperty('--modspotify_rgb_sidebar_indicator_and_hover_button_bg', colRGB)
    //root.style.setProperty('--modspotify_rgb_scrollbar_fg_and_selected_row_bg', darkerColRGB)
    root.style.setProperty('--modspotify_rgb_selected_button', darkerColRGB)
    //root.style.setProperty('--modspotify_rgb_miscellaneous_hover_bg', colRGB)
}

async function songchange() {
    album_uri = Spicetify.Player.data.track.metadata.album_uri
    
    if (album_uri!==undefined) {
        const albumInfo = await getAlbumInfo(album_uri.replace("spotify:album:", ""))

        album_date = new Date(albumInfo.year, (albumInfo.month || 1)-1, albumInfo.day|| 0)
        recent_date = new Date()
        recent_date.setMonth(recent_date.getMonth() - 6)
        album_date = album_date.toLocaleString('default', album_date>recent_date ? { year: 'numeric', month: 'short' } : { year: 'numeric' })
        
        if (nearTrackSpan!==null) nearTrackSpan.innerText = " • " + Spicetify.Player.data.track.metadata.popularity + "%"
        if (nearArtistSpan!==null) nearArtistSpan.innerText = " • " + Spicetify.Player.data.track.metadata.album_title + " • " + album_date

    } else {
        // podcast?
        nearTrackSpan.innerText = ""
        nearArtistSpan.innerText = ""
    }

    Spicetify.colorExtractor(Spicetify.Player.data.track.uri)
        .then((colors) => {
            mainColor = colors['LIGHT_VIBRANT']
            updateColors(document.documentElement) // main app
            if (document.querySelector("#app-queue")!=null) updateColors(document.querySelector("#app-queue").contentDocument.documentElement) // now playing
            if (lastDoc!==null) updateColors(lastDoc) // current iframe
        })
}

Spicetify.Player.addEventListener("songchange", songchange)
Spicetify.Player.addEventListener("appchange", ({"data": data}) => {
    lastDoc = data.isEmbeddedApp ? data.container : data.container.contentDocument.documentElement
    updateColors(lastDoc)
})