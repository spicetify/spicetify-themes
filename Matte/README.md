# Matte

## Screenshots

### Matte

![Matte](screenshots/ylx-matte.png)

### Periwinkle

![Periwinkle](screenshots/ylx-periwinkle.png)

### Periwinkle-Dark

![Periwkinle Dark](screenshots/ylx-periwinkle-dark.png)

### Porcelain

![Porcelain](screenshots/ylx-porcelain.png)

### Gray-Dark1

![Gray Dark 1](screenshots/ylx-gray-dark1.png)

### Gray-Dark2

![Gray Dark 2](screenshots/ylx-gray-dark2.png)

### Gray-Dark3

![Gray Dark 3](screenshots/ylx-gray-dark3.png)

### Gray

![Gray](screenshots/ylx-gray.png)

### Gray-Light

![Gray Light](screenshots/ylx-gray-light.png)

## More

### Description

a Spicetify theme which features a distinct top bar, quick-to-edit CSS variables, and color schemes from Windows visual styles by KDr3w

### Credits

-   Based on [Matte by KDr3w](https://www.deviantart.com/kdr3w/art/Matte-758699852) and their [other themes](https://www.deviantart.com/kdr3w/gallery/68078309/windows-10-themes)

-   Created by [darkthemer](https://github.com/darkthemer)

### Notes

-   Check the very top of `user.css` for quick configs

    -   If you use the Marketplace, go to `Marketplace > Snippets > + Add CSS` and then paste the quick configs found in `user.css`. Edit these as you wish.

```css
/*  ================================
    USER-EDITABLE VARIABLES
    ================================ */

:root {
    /* top bar vars */
    --top-bar-padding-top: 45px;
    --top-bar-padding-right: 20px;
    --top-bar-padding-bottom: 5px;
    --top-bar-padding-left: 20px;
    --tab-border-radius: 6px;
    --top-bar-border-width: 2px;

    /* sidebar vars */
    --sidebar-button-border-radius: 4px;
    --sidebar-border-width: 2px;

    /* player vars */
    --player-height: 90px;
    --player-padding: 0 20px;
    --player-border-width: 2px;

    /* scrollbar vars */
    --scrollbar-border-radius: 4px;
    --scrollbar-width: 6px;
    --scrollbar-width-hover: 6px;
}
```

-   For Windows users, here's how to make the window controls' background match with the topbar background

    -   Enable [CEF/Spotify Tweaks](https://windhawk.net/mods/cef-titlebar-enabler-universal) in Windhawk (recommended)

    -   Put this snippet into your `user.css` (or through the Marketplace's custom CSS feature) (alternative)

```css
/* transparent window controls background */
.spotify__container--is-desktop:not(.fullscreen) body::after {
    content: "";
    position: absolute;
    right: 0;
    z-index: 999;
    backdrop-filter: brightness(2.12);
    /* page zoom [ctrl][+] or [ctrl][-]
       edit width and height accordingly
    */
    width: 135px;
    height: 48px;
}
```

![Window Controls](screenshots/winctrl.png)
