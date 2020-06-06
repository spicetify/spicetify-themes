# Dribbblish

## Screenshots
#### Base
![demo1](./base.png)

#### White
![demo2](./white.png)

#### Dark
![demo3](./dark.png)

#### Nord-Dark
![demo4](./nord-dark.png)

#### Nord-Light
![demo5](./nord-light.png)

## More
### How to install
Run these command:
  
#### Linux and MacOS:
In **Bash**:
```bash
cd "$(dirname "$(spicetify -c)")/Themes/Dribbblish"
cp dribbblish.js ../../Extensions
spicetify config extensions dribbblish.js
spicetify config current_theme Dribbblish color_scheme base
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1
spicetify apply
```

#### Windows
In **Powershell**:
```powershell
cd "$(spicetify -c | Split-Path)\Themes\Dribbblish"
Copy-Item dribbblish.js ..\..\Extensions
spicetify config extensions dribbblish.js
spicetify config current_theme Dribbblish color_scheme base
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1
spicetify apply
```

Windows user, please edit your Spotify shortcut and add flag `--transparent-window-controls` after the Spotify.exe:  
![instruction1](./windows-shortcut-instruction.png)

There are 3 color schemes you can choose: `base`, `white`, `dark`. Change scheme with commands:
```
spicetify config color_scheme <scheme name>
spicetify apply
```
