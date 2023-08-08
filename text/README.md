# text

## Screenshots

#### Display Images

##### with images

```css
--display-card-image: block;
--display-coverart-image: block;
--display-header-image: block;
--display-library-image: block;
--display-tracklist-image: block;
```

![withimg](screenshots/withimg.png)

##### without images

```css
--display-card-image: none;
--display-coverart-image: none;
--display-header-image: none;
--display-library-image: none;
--display-tracklist-image: none;
```

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

### Solarized

![Solarized](screenshots/Solarized.png)

### TokyoNight

![TokyoNight](screenshots/TokyoNight.png)

### TokyoNightStorm

![TokyoNightStorm](screenshots/TokyoNightStorm.png)

## More

### Description

a spicetify theme that mimics the look of [spotify-tui](https://github.com/Rigellute/spotify-tui)

### Credits

created by [darkthemer](https://github.com/darkthemer/)

### Notes

-   **IMPORTANT:** Add the following to your `config-xpui.ini` file. Details as to why are explained [here](https://github.com/JulienMaille/spicetify-dynamic-theme#important).

```ini
[Patch]
xpui.js_find_8008 = ,(\w+=)56,
xpui.js_repl_8008 = ,${1}32,
```

-   **SUGGESTION:** Feel free to edit `color.ini` to swap the accent color (it's green for most of them) into your preferred color based from the color pallete.

    -   https://github.com/catppuccin/catppuccin
    -   https://github.com/dracula/dracula-theme
    -   https://github.com/morhetz/gruvbox/
    -   https://github.com/rebelot/kanagawa.nvim
    -   https://github.com/nordtheme/nord
    -   https://github.com/Rigellute/rigel/
    -   https://github.com/rose-pine/rose-pine-theme
    -   https://github.com/rose-pine/rose-pine-theme
    -   https://github.com/altercation/solarized
    -   https://github.com/enkia/tokyo-night-vscode-theme

-   **SUGGESTION:** Check the very top of `user.css` for user settings

    -   If you use the Marketplace, go to `Marketplace > Snippets > + Add CSS` and then paste the variables found in `user.css` (also below). Edit these as you wish. If you're following this method, don't forget to add `!important` at the end of each property.

```css
/* user settings */
:root {
    --font-family: "DM Mono", monospace !important;
    /*
    --font-family: 'Anonymous Pro', monospace !important;
    --font-family: 'Courier Prime', monospace !important;
    --font-family: 'Cousine', monospace !important;
    --font-family: 'Cutive Mono', monospace !important;
    --font-family: 'DM Mono', monospace !important;
    --font-family: 'Fira Mono', monospace !important;
    --font-family: 'IBM Plex Mono', monospace !important;
    --font-family: 'Inconsolata', monospac !important;
    --font-family: 'Nanum Gothic Coding', monospace !important;
    --font-family: 'PT Mono', monospace !important;
    --font-family: 'Roboto Mono', monospace !important;
    --font-family: 'Share Tech Mono', monospace !important;
    --font-family: 'Source Code Pro', monospace !important;
    --font-family: 'Space Mono', monospace !important;
    --font-family: 'Ubuntu Mono', monospace !important;
    --font-family: 'VT323', monospace !important;
    */
    --font-size: 14px !important;
    --font-size-lyrics: 14px; /* 1.5em (default) */
    --font-weight: 400 !important; /* 200 : 900 */
    --line-height: 1.2 !important;

    --display-card-image: block !important; /* none | block */
    --display-coverart-image: none !important; /* none | block */
    --display-header-image: none !important; /* none | block */
    --display-library-image: block !important; /* none | block */
    --display-tracklist-image: none !important; /* none | block */

    --border-radius: 0px !important;
    --border-width: 1px !important;
    --border-style: solid !important; /* dotted | dashed | solid | double | groove | ridge | inset | outset */
}
```

-   **SUGGESTION:** For Windows users, here's how to make the window controls' background match with the topbar background

    -   Put this snippet into your `user.css` (or through the Marketplace's `+ Add CSS` feature)

```css
/* transparent window controls background */
body::after {
    content: "";
    position: absolute;
    right: 0;
    z-index: 999;
    backdrop-filter: brightness(2.12);
    /* page zoom [ctrl][+] or [ctrl][-]
       edit width and height accordingly
        69%  = 194px 45px
        76%  = 177px 40.5px
        83%  = 162px 37.5px
        91%  = 148px 34px
        100% = 135px 31px (default)
        110% = 123px 28.5px
    */
    width: 135px;
    height: 31px;
}
```

![winctrl](screenshots/winctrl.png)
