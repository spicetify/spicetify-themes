# text

## Screenshots

#### Display Images

##### with images

![withimg](screenshots/withimg.png)

##### without images

![withoutimg](screenshots/withoutimg.png)

### Spotify

![Spotify](screenshots/Spotify.png)

### Spicetify

![Spicetify](screenshots/Spicetify.png)

### CatppuccinMocha

![CatppuccinMocha](screenshots/CatppuccinMocha.png)

### CatppuccinMacchiato

![CatppuccinMacchiato](screenshots/CatppuccinMacchiato.png)

### CatppuccinLatte

![CatppuccinLatte](screenshots/CatppuccinLatte.png)

### Dracula

![Dracula](screenshots/Dracula.png)

### Gruvbox

![Gruvbox](screenshots/Gruvbox.png)

### Kanagawa

![Kanagawa](screenshots/Kanagawa.png)

### Nord

![Nord](screenshots/Nord.png)

### Rigel

![CatppuccinMaRigelcchiato](screenshots/Rigel.png)

### RosePine

![RosePine](screenshots/RosePine.png)

### RosePineMoon

![RosePineMoon](screenshots/RosePineMoon.png)

### RosePineDawn

![RosePineDawn](screenshots/RosePineDawn.png)

### Solarized

![Solarized](screenshots/Solarized.png)

### TokyoNight

![TokyoNight](screenshots/TokyoNight.png)

### TokyoNightStorm

![TokyoNightStorm](screenshots/TokyoNightStorm.png)

### ForestGreen

![ForestGreen](screenshots/ForestGreen.png)

## More

### Description

a spicetify theme that mimics the look of [spotify-tui](https://github.com/Rigellute/spotify-tui)

### Credits

created by [darkthemer](https://github.com/darkthemer/)

### Notes

-   **IMPORTANT:** Add the following to your `config-xpui.ini` file. This is to ensure the height of the song rows in playlists/albums matches what the theme expects them to be. Run `spicetify apply` after adding these lines. Also, make sure to remove them when you stop using this theme.

```ini
[Patch]
xpui.js_find_8008 = ,(rowHeight:\s*)[a-zA-Z0-9_]+,
xpui.js_repl_8008 = ,${1}32,
```

-   **SUGGESTION:** Feel free to edit `color.ini` to swap the accent color (it's green for most of them) into your preferred color based from the color pallete.

    -   https://github.com/catppuccin/catppuccin
    -   https://github.com/dracula/dracula-theme
    -   https://github.com/morhetz/gruvbox
    -   https://github.com/rebelot/kanagawa.nvim
    -   https://github.com/nordtheme/nord
    -   https://github.com/Rigellute/rigel
    -   https://github.com/rose-pine/rose-pine-theme
    -   https://github.com/altercation/solarized
    -   https://github.com/enkia/tokyo-night-vscode-theme

-   **SUGGESTION:** Check the very top of `user.css` for user settings

    -   If you use the Marketplace, go to `Marketplace > Snippets > + Add CSS` and then paste the variables found in `user.css` (also below). Edit these as you wish. If you're following this method, don't forget to add `!important` at the end of each property.

```css
/* user settings */
:root {
    --font-family: "DM Mono", monospace;
    /*
    --font-family: 'Anonymous Pro', monospace;
    --font-family: 'Courier Prime', monospace;
    --font-family: 'Cousine', monospace;
    --font-family: 'Cutive Mono', monospace;
    --font-family: 'DM Mono', monospace;
    --font-family: 'Fira Mono', monospace;
    --font-family: 'IBM Plex Mono', monospace;
    --font-family: 'Inconsolata', monospace;
    --font-family: 'Nanum Gothic Coding', monospace;
    --font-family: 'PT Mono', monospace;
    --font-family: 'Roboto Mono', monospace;
    --font-family: 'Share Tech Mono', monospace;
    --font-family: 'Source Code Pro', monospace;
    --font-family: 'Space Mono', monospace;
    --font-family: 'Ubuntu Mono', monospace;
    --font-family: 'VT323', monospace;
    */
    --font-size: 14px;
    --font-weight: 400; /* 200 : 900 */
    --line-height: 1.2;

    --font-size-lyrics: 14px; /* 1.5em (default) */

    --font-family-header: "asciid";
    --font-size-multiplier-header: 4;

    --display-card-image: block; /* none | block */
    --display-coverart-image: none; /* none | block */
    --display-header-image: none; /* none | block */
    --display-library-image: block; /* none | block */
    --display-tracklist-image: none; /* none | block */
    --display-spicetify-banner-ascii: block; /* none | block */
    --display-music-banner-ascii: none; /* none | block */

    --border-radius: 0px;
    --border-width: 1px;
    --border-style: solid; /* dotted | dashed | solid | double | groove | ridge | inset | outset */
}
```

-   **SUGGESTION:** For Windows users, here's how to make the window controls' background match with the topbar background

    -   Put this snippet into your `user.css` (or through the Marketplace's `+ Add CSS` feature)

```css
/* transparent window controls background */
.spotify__container--is-desktop:not(.fullscreen) body::after {
    content: "";
    position: absolute;
    right: 0;
    z-index: 999;
    backdrop-filter: brightness(2.12);
    /* page zoom [ctrl][+] or [ctrl][-]
       edit width and height accordingly */
    width: 135px;
    /* depending on what global status bar
       style is enabled height need to be
       changed accordingly. */
    height: 64px;
}
```

![winctrl](screenshots/winctrl.png)
