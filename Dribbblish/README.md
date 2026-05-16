# Dribbblish — Spicetify Theme

A modern, highly customizable Spotify theme for Spicetify with multiple color schemes and advanced UI enhancements.

---

## Preview

### Base  
![base](base.png)

### White  
![white](white.png)

### Dark  
![dark](dark.png)

### Nord Light  
![nord-light](nord-light.png)

### Nord Dark  
![nord-dark](nord-dark.png)

### Beach Sunset  
![beach-sunset](beach-sunset.png)

### Purple  
![purple](purple.png)

### Samurai  
![samurai](samurai.png)

### Gruvbox  
![gruvbox](gruvbox.png)

### Gruvbox Material Dark  
![gruvbox-material-dark](gruvbox-material-dark.png)

### Rosé Pine  
![rosepine](rosepine.png)

### Lunar  
![lunar](lunar.png)

### Catppuccin Latte  
![catppuccin-latte](catppuccin-latte.png)

### Catppuccin Frappe  
![catppuccin-frappe](catppuccin-frappe.png)

### Catppuccin Macchiato  
![catppuccin-macchiato](catppuccin-macchiato.png)

### Catppuccin Mocha  
![catppuccin-mocha](catppuccin-mocha.png)

---

## Features

### Resizable Sidebar
<img src="https://i.imgur.com/1zomkmd.png" alt="img" align="center" width="500px">

---

### Customizable Sidebar
Rearrange icon positions, stick icons to header, or hide unnecessary icons to save space.

**How to use:**
1. Open Profile menu.
2. Enable **Sidebar config** mode.
3. Hover over icons to reveal control buttons.
4. Disable **Sidebar config** mode to save.

<img src="https://i.imgur.com/86gqPe8.png" alt="img" align="center" width="500px">

---

### Playlist Folder Images
Right-click a playlist folder and assign custom images.  
All Chrome-supported image formats work; small and compressed images are recommended.

<img src="https://i.imgur.com/WGQ7Bev.gif" alt="img" align="center" width="500px">

---

### Left / Right Expanded Cover
Toggle **Right expanded cover** in the Profile menu to move the expanded album artwork to the left or right.

---

## Requirements

- Spicetify **>= v2.5.0**
- Spotify **>= v1.1.56**

---

## Auto Install

### Windows

```powershell
Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/spicetify/spicetify-themes/master/Dribbblish/install.ps1" | Invoke-Expression
````

---

## Linux — Hassle-Free Script Install

Ready-made install script is available:

```
install-linux.sh
```

### Usage

```bash
chmod +x install-linux.sh
./install-linux.sh
```

---

## Manual Install

### Linux & macOS (Bash)

```bash
cd "$(dirname "$(spicetify -c)")/Themes/Dribbblish"
spicetify config current_theme Dribbblish color_scheme base
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1
spicetify apply
```

---

### Windows (PowerShell)

```powershell
cd "$(spicetify -c | Split-Path)\Themes\Dribbblish"
spicetify config current_theme Dribbblish color_scheme base
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1
spicetify apply
```

---

## Sidebar Height Patch (Important)

From Spotify **> v1.1.62**, adaptive rendering breaks interaction when playlist item height is modified via CSS.

Add the following to your Spicetify config file:

```ini
[Patch]
xpui.js_find_8008 = ,(\w+=)32,
xpui.js_repl_8008 = ,${1}56,
```

---

## Change Color Schemes

Available schemes:

`base`, `white`, `dark`, `dracula`, `nord-dark`, `nord-light`,
`beach-sunset`, `samurai`, `purple`, `gruvbox`,
`gruvbox-material-dark`,
`catppuccin-latte`, `catppuccin-frappe`, `catppuccin-macchiato`, `catppuccin-mocha`

### Command

```bash
spicetify config color_scheme <scheme name>
spicetify apply
```

---

## Auto Uninstall

### Windows

```powershell
Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/spicetify/spicetify-themes/v2/Dribbblish/uninstall.ps1" | Invoke-Expression
```

---

## Linux — Hassle-Free Script Uninstall

Ready-made uninstall script is available:

```
uninstall-linux.sh
```

### Usage

```bash
chmod +x uninstall-linux.sh
./uninstall-linux.sh
```

---

## Manual Uninstall

```bash
spicetify config current_theme " " color_scheme " "
spicetify apply
```

---

```
