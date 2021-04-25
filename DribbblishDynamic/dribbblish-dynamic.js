// Hide popover message
document.getElementById("popover-container").style.height = 0;
document.documentElement.style.setProperty('--warning_message', ' ');

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
                button.classList.add("Button", "Button--style-icon-background", "Button--folder");
                item.setAttribute("data-tooltip", item.innerText);
                replaceTextWithIcon(link.firstChild, 'spoticon-collection-24');
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
            el.classList.add(iconName);
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
                case "made-for-you":            return "user-circle";
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
                //case "home":                  return "home";
                //case "browse":                return "browse";
                //case "radio":                 return "radio";
            }})(item.href.replace("spotify:app:", ""));
            if (icon) {
                icon = `spoticon-${icon}-24`;
            }
            else icon = ((app) => {switch (app) {
                case "reddit":                  return "icomoon-reddit";
                case "recently-played":         return "icomoon-recently-played";
            }})(item.href.replace("spotify:app:", ""));

            replaceTextWithIcon(item.firstChild, icon);
        });

    waitForElement([`[href="spotify:app:queue:history"]`], ([query]) => {
        replaceTextWithIcon(query.firstChild);
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

var big_album_cover = document.querySelector('#now-playing-image-small');

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type == "attributes") {
            if(big_album_cover.getAttribute("data-log-context") === "cover-large"){
                document.documentElement.style.setProperty('--move_buddy_list', "250px");
            }else{
                document.documentElement.style.setProperty('--move_buddy_list', "0px");
            }
        }
    });
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

const LightenDarkenColor = (h, p) => '#' + [1, 3, 5].map(s => parseInt(h.substr(s, 2), 16)).map(c => parseInt((c * (100 + p)) / 100)).map(c => (c < 255 ? c : 255)).map(c => c.toString(16).padStart(2, '0')).join('');

let nearArtistSpan = null
let mainColor = getComputedStyle(document.documentElement).getPropertyValue('--modspotify_main_fg')
let mainColor2 = getComputedStyle(document.documentElement).getPropertyValue('--modspotify_main_bg')
let isLightBg = isLight(mainColor2)
let customDarken = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--custom_darken'))

waitForElement([".artist"], (queries) => {
    nearArtistSpan = document.createElement("span");
    nearArtistSpan.id = "dribbblish-album-info";
    queries[0].append(nearArtistSpan);
});

function updateColors(root) {
    if( root===null) return;
    let colHex = LightenDarkenColor(mainColor, customDarken)
    let colRGB = hexToRgb(colHex)
    let darkerColHex = LightenDarkenColor(colHex, isLightBg ? 45 : -40)
    let darkerColRGB = hexToRgb(darkerColHex)

    let sliderColHex = LightenDarkenColor(colHex, isLightBg ? 40 : -65)
    let sliderColRGB = hexToRgb(sliderColHex)    
    let buttonBgColHex = isLightBg ? "#FFFFFF" : LightenDarkenColor(colHex, -80)
    let buttonBgColRGB = hexToRgb(buttonBgColHex)

    root.style.setProperty('--is_light', isLightBg ? 1 : 0)
    
    root.style.setProperty('--modspotify_main_fg', colHex)
    root.style.setProperty('--modspotify_active_control_fg', colHex)
    root.style.setProperty('--modspotify_secondary_bg', colHex)
    //root.style.setProperty('--modspotify_pressing_button_bg', colHex)
    root.style.setProperty('--modspotify_indicator_fg_and_button_bg', buttonBgColHex)
    root.style.setProperty('--modspotify_pressing_fg', colHex)
    root.style.setProperty('--modspotify_sidebar_indicator_and_hover_button_bg', colHex)
    //root.style.setProperty('--modspotify_scrollbar_fg_and_selected_row_bg', darkerColHex)
    root.style.setProperty('--modspotify_selected_button', darkerColHex)
    //root.style.setProperty('--modspotify_miscellaneous_hover_bg', colHex)
    root.style.setProperty('--modspotify_slider_bg', sliderColHex)
    
    root.style.setProperty('--modspotify_rgb_main_fg', colRGB)
    root.style.setProperty('--modspotify_rgb_active_control_fgg', colRGB)
    root.style.setProperty('--modspotify_rgb_secondary_bg', colRGB)
    //root.style.setProperty('--modspotify_rgb_pressing_button_bg', colRGB)
    root.style.setProperty('--modspotify_rgb_indicator_fg_and_button_bg', buttonBgColRGB)    
    root.style.setProperty('--modspotify_rgb_pressing_fg', colRGB)
    root.style.setProperty('--modspotify_rgb_sidebar_indicator_and_hover_button_bg', colRGB)
    //root.style.setProperty('--modspotify_rgb_scrollbar_fg_and_selected_row_bg', darkerColRGB)
    root.style.setProperty('--modspotify_rgb_selected_button', darkerColRGB)
    //root.style.setProperty('--modspotify_rgb_miscellaneous_hover_bg', colRGB)
    root.style.setProperty('--modspotify_rgb_slider_bg', sliderColRGB)

    // Also update the color of the icons for bright and white backgrounds to remain readable.
    let isLightFg = isLight(colHex);
    if( isLightBg ) isLightFg = !isLightFg;
    iconCol = getComputedStyle(document.documentElement).getPropertyValue(isLightFg ? '--modspotify_main_bg' : '--modspotify_secondary_fg');
    root.style.setProperty('--modspotify_preserve_1', iconCol);
}

function updateColorsAllIframes() {
    // code below works but then generate many errors on page change.
    let frames = document.getElementsByTagName("iframe");
    for (i=0; i<frames.length; ++i) {
        try {
            updateColors(frames[i].contentDocument.documentElement)
        } catch (error) {
            console.error(error);
        }
    }
}

function trickHideGradient(display) {
    // gradient can't be animated so hide and reshow
    document.querySelector("#dribbblish-sidebar-fade-in").style.display = display
}

async function songchange() {
    let album_uri = Spicetify.Player.data.track.metadata.album_uri
    
    if (album_uri!==undefined) {
        const albumInfo = await getAlbumInfo(album_uri.replace("spotify:album:", ""))

        let album_date = new Date(albumInfo.year, (albumInfo.month || 1)-1, albumInfo.day|| 0)
        let recent_date = new Date()
        recent_date.setMonth(recent_date.getMonth() - 6)
        album_date = album_date.toLocaleString('default', album_date>recent_date ? { year: 'numeric', month: 'short' } : { year: 'numeric' })
        album_link = "<a title=\""+Spicetify.Player.data.track.metadata.album_title+"\" href=\""+album_uri+"\" data-uri=\""+album_uri+"\" data-interaction-target=\"album-name\" class=\"tl-cell__content\">"+Spicetify.Player.data.track.metadata.album_title+"</a>"
        
        if (nearArtistSpan!==null)
            nearArtistSpan.innerHTML = " — " + album_link + " • " + album_date
    } else if (Spicetify.Player.data.track.metadata.album_track_number==0) {
        // podcast
        nearArtistSpan.innerText = Spicetify.Player.data.track.metadata.album_title
    } else if (Spicetify.Player.data.track.metadata.is_local=="true") {
        // local file
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

            // Spotify returns hex colors with improper length
            while( mainColor.length!=4 && mainColor.length<7 )
                { mainColor = mainColor.replace("#", "#0"); }

            // main app
            trickHideGradient('none') // bottom left gradient looks bad when changing color
            updateColors(document.documentElement)
            setTimeout(trickHideGradient, 1500, 'block') //animation lasts 1.5sec

            // most pages are iframes, they need a specific color update
            updateColorsAllIframes()
        }, (err) => {
            console.log(err)
            // On startup we receive songChange too soon and colorExtractor will fail
            // todo: retry only colorExtract
            setTimeout(songchange, 200)
        })
}

Spicetify.Player.addEventListener("songchange", songchange)

window.addEventListener("message", ({data: info}) => {
    if( info.type=="navigation_request_state" )
        setTimeout(updateColorsAllIframes, 200)
});

// Add "About" item in profile menu
new Spicetify.Menu.Item("About", false, () => window.open("spotify:app:about")).register();

// Track elapsed time
(function Dribbblish() {
    if (!Spicetify.Player.origin || !Spicetify.EventDispatcher || !Spicetify.Event) {
        setTimeout(Dribbblish, 300);
        return;
    }

    const progBar = Spicetify.Player.origin.progressbar;

    // Remove default elapsed element update since we already hide it
    progBar._listenerMap["progress"].pop();

    const tooltip = document.createElement("div");
    tooltip.className = "handle prog-tooltip";
    progBar._innerElement.append(tooltip);
    
    function updateTooltip(e) {
        const curWidth = progBar._innerElement.offsetWidth;
        const maxWidth = progBar._container.offsetWidth;
        const ttWidth = tooltip.offsetWidth / 2;
        if (curWidth < ttWidth) {
            tooltip.style.right = String(-ttWidth * 2 + curWidth) + "px";
        } else if (curWidth > maxWidth - ttWidth) {
            tooltip.style.right = String(curWidth - maxWidth) + "px";
        } else {
            tooltip.style.right = String(-ttWidth) + "px";
        }
        tooltip.innerText = Spicetify.Player.formatTime(e) + " / " +
            Spicetify.Player.formatTime(Spicetify.Player.getDuration());
    }
    progBar.addListener("progress", (e) => {updateTooltip(e.value)});
    updateTooltip(progBar._currentValue);
})();
