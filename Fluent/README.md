# Fluent

## Screenshots

### Dark
![dark-1](screenshots/dark-1.png)
![dark-2](screenshots/dark-2.png)

### Comfy
![comfy-1](screenshots/comfy-1.jpg)
![comfy-2](screenshots/comfy-2.jpg)

### Light
![light-1](screenshots/light-1.png)

## More

### About

[Spicetify](https://github.com/spicetify/spicetify-cli) theme inspired by Windows 11 UI and Microsoft's Fluent Design.  
Requires Segoe UI font.

Based off [Ziro](https://github.com/schnensch0/ziro) theme by [schnensch](https://github.com/schnensch0)  
[Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons) by Microsoft Corporation  
[Phosphor Icons](https://github.com/phosphor-icons/phosphor-icons) by Phosphor Icons  

### Install

Make sure spicetify >= v2.7.0 is installed. Run these commands:

#### Windows
In **Powershell**:
```powershell
cd "$(spicetify -c | Split-Path)\Themes\Fluent"
Copy-Item fluent.js ..\..\Extensions
spicetify config extensions fluent.js
spicetify config current_theme Fluent color_scheme dark
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1
spicetify apply
```

#### macOS and Linux
In **Bash**:
```bash
cd "$(dirname "$(spicetify -c)")/Themes/Fluent"
mkdir -p ../../Extensions
cp fluent.js ../../Extensions/.
spicetify config extensions fluent.js
spicetify config current_theme Fluent color_scheme dark
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1
spicetify apply
```

### Important
For the sidebar playlists to show properly, ensure that these two lines are added in your config-xpui.ini file:
```ini
[Patch]
xpui.js_find_8008 = ,(\w+=)32,
xpui.js_repl_8008 = ,${1}56,
```


### Customization

Three color schemes are available: `light` or `dark` or `comfy`. Change scheme with commands:
```
spicetify config color_scheme <scheme_name>
spicetify apply
```

### More Options
- You can change the accent color in the theme folder's color.ini file.  
- If you are using Windows, you can hide the window controls by adding the flag `--transparent-window-controls` after Spotify.exe in your Spotify shortcut.
- Use "Sidebar config" in the Spotify profile menu to hide/unhide and stick/unstick the Liked Songs and My Episodes icons in the sidebar.
