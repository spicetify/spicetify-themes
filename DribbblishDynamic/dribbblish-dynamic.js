// Hide popover message
document.getElementById("popover-container").style.height = 0;

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
                case "collection-songs":        return "heart";
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

function isLight(hex) {
    var [r,g,b] = hexToRgb(hex).split(',').map(Number);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128;
}

function hexToRgb(hex) {
    var bigint = parseInt(hex.replace("#",""), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return r + "," + g + "," + b;
}

function LightenDarkenColor(hex, amt) {
    var [r,g,b] = hexToRgb(hex).split(',').map(Number);
    r = Math.max(0, r + amt);
    b = Math.max(0, b + amt);
    g = Math.max(0, g + amt);
    var newColor = g | (b << 8) | (r << 16);
    return '#'+newColor.toString(16);
}

var nearArtistSpan = null
var mainColor = getComputedStyle(document.documentElement).getPropertyValue('--modspotify_main_fg')
var mainColor2 = getComputedStyle(document.documentElement).getPropertyValue('--modspotify_main_bg')
var isLightBg = isLight(mainColor2)
var lastDoc = null

waitForElement([".artist"], (queries) => {
    nearArtistSpan = document.createElement("span");
    nearArtistSpan.id = "dribbblish-album-info";
    queries[0].append(nearArtistSpan);
});

function updateColors(root) {    
    colHex = mainColor
    colRGB = hexToRgb(colHex)
    darkerColHex = LightenDarkenColor(colHex, isLightBg ? 50 : -50)
    darkerColRGB = hexToRgb(darkerColHex)

    root.style.setProperty('--is_light', isLightBg ? 1 : 0)
    
    root.style.setProperty('--modspotify_main_fg', colHex)
    root.style.setProperty('--modspotify_active_control_fg', colHex)
    root.style.setProperty('--modspotify_secondary_bg', colHex)
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
    //root.style.setProperty('--modspotify_rgb_pressing_button_bg', colRGB)
    //root.style.setProperty('--modspotify_rgb_indicator_fg_and_button_bg', colRGB)    
    root.style.setProperty('--modspotify_rgb_pressing_fg', colRGB)
    root.style.setProperty('--modspotify_rgb_sidebar_indicator_and_hover_button_bg', colRGB)
    //root.style.setProperty('--modspotify_rgb_scrollbar_fg_and_selected_row_bg', darkerColRGB)
    root.style.setProperty('--modspotify_rgb_selected_button', darkerColRGB)
    //root.style.setProperty('--modspotify_rgb_miscellaneous_hover_bg', colRGB)

    // Also update the color of the icons for bright and white backgrounds to remain readable.
    isLightFg = isLight(colHex);
    iconCol = getComputedStyle(document.documentElement).getPropertyValue(isLightFg ? '--modspotify_main_bg' : '--modspotify_secondary_fg');
    root.style.setProperty('--modspotify_preserve_1', iconCol);
}

function updateColorsAllIframes() {
    // playing queue
    if (document.querySelector("#app-queue")!=null) updateColors(document.querySelector("#app-queue").contentDocument.documentElement)
    // collection (podcast, recent, etc.)
    if (document.querySelector("#app-collection")!=null) updateColors(document.querySelector("#app-collection").contentDocument.documentElement)
    // collection (local files)
    if (document.querySelector("#app-collection-songs")!=null) updateColors(document.querySelector("#app-collection-songs").contentDocument.documentElement)
    // buddy list
    if (document.querySelector("#iframe-buddy-list")!=null) updateColors(document.querySelector("#iframe-buddy-list").contentDocument.documentElement)
    // playlist
    if (document.querySelector("#app-playlist")!=null) updateColors(document.querySelector("#app-playlist").contentDocument.documentElement)
    // search
    if (document.querySelector("#app-search")!=null) updateColors(document.querySelector("#app-search").contentDocument.documentElement)
    // genius
    if (document.querySelector("#app-genius")!=null) updateColors(document.querySelector("#app-genius").contentDocument.documentElement)
    // browse
    if (document.querySelector("#app-browse")!=null) updateColors(document.querySelector("#app-browse").contentDocument.documentElement)
    // genre
    if (document.querySelector("#app-genre")!=null) updateColors(document.querySelector("#app-genre").contentDocument.documentElement)
    // artist
    if (document.querySelector("#app-artist")!=null) updateColors(document.querySelector("#app-artist").contentDocument.documentElement)
    
    // code below works but then generate many errors on page change.
    /*frames = document.getElementsByTagName("iframe");
    for (i=0; i<frames.length; ++i) {
        console.log(i+". "+frames[i].id)
        updateColors(frames[i].contentDocument.documentElement)
    }*/
}

function trickHideGradient(display) {
    // gradient can't be animated so hide and reshow
    document.querySelector("#dribbblish-sidebar-fade-in").style.display = display
}

async function songchange() {
    album_uri = Spicetify.Player.data.track.metadata.album_uri
    
    if (album_uri!==undefined) {
        const albumInfo = await getAlbumInfo(album_uri.replace("spotify:album:", ""))

        album_date = new Date(albumInfo.year, (albumInfo.month || 1)-1, albumInfo.day|| 0)
        recent_date = new Date()
        recent_date.setMonth(recent_date.getMonth() - 6)
        album_date = album_date.toLocaleString('default', album_date>recent_date ? { year: 'numeric', month: 'short' } : { year: 'numeric' })
        album_link = "<a title=\""+Spicetify.Player.data.track.metadata.album_title+"\" href=\""+album_uri+"\" data-uri=\""+album_uri+"\" data-interaction-target=\"album-name\" class=\"tl-cell__content\">"+Spicetify.Player.data.track.metadata.album_title+"</a>"
        
        if (nearArtistSpan!==null) nearArtistSpan.innerHTML = " — " + album_link + " • " + album_date
        
        //waitForElement([".album-art__artist-name"], (queries) => {
        //    queries[0].innerText += "`n" + Spicetify.Player.data.track.metadata.album_title + " • " + album_date
        //}, 1000)
    } else if (Spicetify.Player.data.track.metadata.album_track_number==0) {
        // podcast?
        nearArtistSpan.innerText = Spicetify.Player.data.track.metadata.album_title
    } else if (Spicetify.Player.data.track.metadata.is_local=="true") {
        // local?
        nearArtistSpan.innerText = " — " + Spicetify.Player.data.track.metadata.album_title
    } else {
        // When clicking a song from the homepage, songChange is fired with half empty metadata
        // todo: retry only once?
        setTimeout(songchange, 200)
    }
    
    document.documentElement.style.setProperty('--image_url', 'url("'+Spicetify.Player.data.track.metadata.image_url+'")')

    Spicetify.colorExtractor(Spicetify.Player.data.track.uri)
        .then((colors) => {
            mainColor = colors['LIGHT_VIBRANT']
            while( mainColor.length!=4 && mainColor.length<7 ) { mainColor = mainColor.replace("#", "#0"); }

            trickHideGradient('none')
            updateColors(document.documentElement) // main app
            setTimeout(trickHideGradient, 1500, 'block') //animation lasts 1.5sec
            updateColorsAllIframes()
        }, (err) => {
            console.log(err)
            // On startup we receive songChange too soon and colorExtractor will fail
            // todo: retry only colorExtract
            setTimeout(songchange, 200)
        })
}

Spicetify.Player.addEventListener("songchange", songchange)
Spicetify.Player.addEventListener("appchange", ({"data": data}) => {
    //console.log(data.container)
    //lastDoc = data.container.contentDocument.documentElement || data.container
    setTimeout(updateColorsAllIframes, 200)
    //updateColorsAllIframes()
})
