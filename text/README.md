# text

## Screenshots

#### Display Images

##### with images `--display-images: block;`

![withimg](screenshots/withimg.png)

##### without images `--display-images: none;`

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

-   Feel free to edit `color.ini` to swap the accent color (it's green for most of them) into your preferred color based from the color pallete.

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

-   Check the very top of `user.css` for user settings

    -   If you use the Marketplace, go to `Marketplace > Snippets > + Add CSS` and then paste the variables found in `user.css` (also below). Edit these as you wish.

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

    --display-images: none; /* none | block */

    --border-radius: 0px;
    --border-width: 1px;
    --border-style: solid; /* dotted | dashed | solid | double | groove | ridge | inset | outset */
}
```

-   For Windows users, here's how to make the window controls' background match with the topbar background

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
