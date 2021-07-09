let current = '1.7'

/* css is injected so this works with untouched user.css from Dribbblish */
/* dark theme */
document.styleSheets[0].insertRule(`
    :root {
        --system_is_dark: 1;
    }`)

document.styleSheets[0].insertRule(`
    @media (prefers-color-scheme: light) {
        :root {
            --system_is_dark: 0 !important;
        }
    }`)

/* progressbar tooltip text color */
document.styleSheets[0].insertRule(`
    .playback-bar .prog-tooltip {
        color: var(--spice-sidebar-text) !important;
    }`)

/* edit button of CustomApps */
document.styleSheets[0].insertRule(`
    .reddit-sort-container button.switch,
    .new-releases-header button.switch,
    .lyrics-tabBar-header button.switch {
        background-color: rgba(var(--spice-rgb-subtext), 0.15) !important;
        color: var(--spice-text);
    }`)

document.styleSheets[0].insertRule(`
    .reddit-sort-container button.switch:hover,
    .new-releases-header button.switch:hover,
    .lyrics-tabBar-header button.switch:hover {
        background-color: rgba(var(--spice-rgb-subtext), 0.3) !important;
    }`)

document.styleSheets[0].insertRule(`
    .lyrics-lyricsContainer-LyricsBackground {
        background: linear-gradient(180deg, transparent 0px, transparent 60px, var(--lyrics-color-background) 61px) !important;
    }`)

/* big cover opacity on hover */
document.styleSheets[0].insertRule(`
    .main-coverSlotExpanded-container:hover .cover-art,
    .main-coverSlotExpanded-container:hover img {
        opacity: 0.5;
    }`)

document.styleSheets[0].insertRule(`
    .main-navBar-navBar a:hover,
    .main-navBar-navBar a:hover span,
    .main-buddyFeed-activityMetadata a:hover {
        color: var(--spice-shadow) !important;
    }`)

document.styleSheets[0].insertRule(`
    .collection-collectionEntityHeroCard-likedSongs,
    .collection-collectionEntityHeroCard-likedSongs .main-cardHeader-link,
    .collection-collectionEntityHeroCard-likedSongs .collection-collectionEntityHeroCard-descriptionContainer,
    .x-heroCategoryCard-heroTitle,
    .main-rootlist-expandArrow:focus,
    .main-rootlist-expandArrow:hover,
    .main-rootlist-textWrapper:focus,
    .main-rootlist-textWrapper:hover,
    .main-contextMenu-menuHeading,
    .main-contextMenu-menuItemButton,
    .main-contextMenu-menuItemButton:not(.main-contextMenu-disabled):focus,
    .main-contextMenu-menuItemButton:not(.main-contextMenu-disabled):hover {
        color: var(--spice-sidebar-text) !important;
    }`)

/* js */
function getAlbumInfo(uri) {
    return Spicetify.CosmosAsync.get(`hm://album/v1/album-app/album/${uri}/desktop`);
}

function isLight(hex) {
    var [r,g,b] = hexToRgb(hex).map(Number)
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return brightness > 128
}

function hexToRgb(hex) {
    var bigint = parseInt(hex.replace("#",""), 16)
    var r = (bigint >> 16) & 255
    var g = (bigint >> 8) & 255
    var b = bigint & 255
    return [r, g, b]
}

function rgbToHex([r, g, b]) {
    const rgb = (r << 16) | (g << 8) | (b << 0);
    return '#' + (0x1000000 + rgb).toString(16).slice(1);
}

const LightenDarkenColor = (h, p) => '#' + [1, 3, 5].map(s => parseInt(h.substr(s, 2), 16)).map(c => parseInt((c * (100 + p)) / 100)).map(c => (c < 255 ? c : 255)).map(c => c.toString(16).padStart(2, '0')).join('');

function rgbToHsl([r, g, b]) {
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;
  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb([h, s, l]) {
  var r, g, b;
  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [r * 255, g * 255, b * 255];
}

function setLightness(hex, lightness) {
    hsl = rgbToHsl(hexToRgb(hex))
    hsl[2] = lightness
    return rgbToHex(hslToRgb(hsl))
}

let nearArtistSpan = null
let mainColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-text')
let mainColorBg = getComputedStyle(document.documentElement).getPropertyValue('--spice-main')

waitForElement([".main-trackInfo-container"], (queries) => {
    nearArtistSpan = document.createElement("div")
    nearArtistSpan.classList.add("main-trackInfo-artists", "ellipsis-one-line", "main-type-finale")
    queries[0].append(nearArtistSpan)
});

function setRootColor(name, colHex) {
    let root = document.documentElement
    if (root===null) return
    root.style.setProperty('--spice-' + name, colHex)
    root.style.setProperty('--spice-rgb-' + name, hexToRgb(colHex).join(','))
}

function toggleDark(setDark) {
    if (setDark===undefined) setDark = isLight(mainColorBg)

    document.documentElement.style.setProperty('--is_light', setDark ? 0 : 1)
    mainColorBg = setDark ? "#0A0A0A" : "#FAFAFA"

    setRootColor('main', mainColorBg)
    setRootColor('player', mainColorBg)
    setRootColor('card', setDark ? "#040404" : "#ECECEC")
    setRootColor('subtext', setDark ? "#EAEAEA" : "#3D3D3D")
    setRootColor('notification', setDark ? "#303030" : "#DDDDDD")

    updateColors(mainColor)
}

/* Init with current system light/dark mode */
let systemDark = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--system_is_dark'))==1
toggleDark(systemDark)

DribbblishShared.configMenu.register();
DribbblishShared.configMenu.addItem(new Spicetify.Menu.Item(
    "Dark mode",
    systemDark,
    (self) => { toggleDark(); self.isEnabled = !self.isEnabled; }
));

function updateColors(colHex) {
    let isLightBg = isLight(mainColorBg)
    if( isLightBg ) colHex = LightenDarkenColor(colHex, -15) // vibrant color is always too bright for white bg mode

    let darkColHex = LightenDarkenColor(colHex, isLightBg ? 12 : -20)
    let darkerColHex = LightenDarkenColor(colHex, isLightBg ? 30 : -40)
    let buttonBgColHex = setLightness(colHex, isLightBg ? 0.90 : 0.14)
    setRootColor('text', colHex)
    setRootColor('button', darkerColHex)
    setRootColor('button-active', darkColHex)
    setRootColor('selected-row', darkerColHex)
    setRootColor('tab-active', buttonBgColHex)
    setRootColor('button-disabled', buttonBgColHex)
    setRootColor('sidebar', colHex)
}

async function songchange() {
    // warning popup
    if (Spicetify.PlaybackControl.featureVersion < "1.1.57")
        Spicetify.showNotification("Your version of Spotify (" + Spicetify.PlaybackControl.featureVersion + ") is un-supported")
    
    let album_uri = Spicetify.Player.data.track.metadata.album_uri
    let bgImage = Spicetify.Player.data.track.metadata.image_url
    if (bgImage === undefined) {
        bgImage = "/images/tracklist-row-song-fallback.svg"
        mainColor = "#509bf5"
        updateColors(mainColor)
    }

    if (album_uri !== undefined && !album_uri.includes('spotify:show')) {
        const albumInfo = await getAlbumInfo(album_uri.replace("spotify:album:", ""))

        let album_date = new Date(albumInfo.year, (albumInfo.month || 1)-1, albumInfo.day|| 0)
        let recent_date = new Date()
        recent_date.setMonth(recent_date.getMonth() - 6)
        album_date = album_date.toLocaleString('default', album_date>recent_date ? { year: 'numeric', month: 'short' } : { year: 'numeric' })
        album_link = "<a title=\""+Spicetify.Player.data.track.metadata.album_title+"\" href=\""+album_uri+"\" data-uri=\""+album_uri+"\" data-interaction-target=\"album-name\" class=\"tl-cell__content\">"+Spicetify.Player.data.track.metadata.album_title+"</a>"
        
        if (nearArtistSpan!==null)
            nearArtistSpan.innerHTML = album_link + " — " + album_date
        else
            setTimeout(songchange, 200)
    } else if (Spicetify.Player.data.track.uri.includes('spotify:episode')) {
        // podcast
        bgImage = bgImage.replace('spotify:image:', 'https://i.scdn.co/image/')
        if (nearArtistSpan?.innerText) nearArtistSpan.innerText = Spicetify.Player.data.track.metadata.album_title
    } else if (Spicetify.Player.data.track.metadata.is_local=="true") {
        // local file
        if (nearArtistSpan?.innerText) nearArtistSpan.innerText = Spicetify.Player.data.track.metadata.album_title
    } else {
        // When clicking a song from the homepage, songChange is fired with half empty metadata
        // todo: retry only once?
        setTimeout(songchange, 200)
    }

    document.documentElement.style.setProperty('--image_url', 'url("' + bgImage + '")')
}

Spicetify.Player.addEventListener("songchange", songchange)

function pickCoverColor(img) {
    var swatches = new Vibrant(img, 12).swatches()
    cols = isLight(mainColorBg) ? ["Vibrant", "DarkVibrant", "Muted", "LightVibrant"]
                                : ["Vibrant", "LightVibrant", "Muted", "DarkVibrant"]
    mainColor = "#509bf5"
    for (var col in cols)
        if (swatches[cols[col]]) {
            mainColor = swatches[cols[col]].getHex()
            break
        }
    updateColors(mainColor)
}

waitForElement([".cover-art-image"], (queries) => {
    queries[0].addEventListener('load', function() {
        try {
            pickCoverColor(queries[0])
        } catch (error) {
            console.log(error);
            setTimeout(pickCoverColor, 300, queries[0])
        }
    });
});

(function Startup() {
    if (!Spicetify.showNotification) {
        setTimeout(Startup, 300)
        return
    }
    // Check latest release
    fetch('https://api.github.com/repos/JulienMaille/dribbblish-dynamic-theme/releases/latest').then(response => {
      return response.json();
    }).then(data => {
      if( data.tag_name > current ) {
          upd = document.createElement("div")
          upd.classList.add("ellipsis-one-line", "main-type-finale")
          document.querySelector(".main-userWidget-box").append(upd)
          upd.append(`NEW v${data.tag_name} available`)
          upd.setAttribute("title", `Changes: ${data.name}`)
      }
    }).catch(err => {
      // Do something for an error here
    });
    Spicetify.showNotification("Applied system " + (systemDark ? "dark" : "light") + " theme.")
})()

/* translucid background cover */
document.styleSheets[0].addRule('.Root__top-container::before',
`   content: '';
    background-image: var(--image_url);
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    position: fixed;
    display: block;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    filter: blur(15px);
    pointer-events: none;
    backface-visibility: hidden;
    will-change: transform;
    opacity: calc(0.07 + 0.03 * var(--is_light, 0));
    z-index: +3;`)

document.documentElement.style.setProperty('--warning_message', ' ');