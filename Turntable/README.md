# Turntable

<p align="center">
  <a href="https://github.com/spicetify/spicetify-cli"><img src="https://img.shields.io/badge/Spicetify-2.9.9-eb5a37"></a>
  <a href="https://github.com/spicetify/spicetify-cli"><img src="https://img.shields.io/badge/Spotify-1.1.85-1DB954"></a>
</p>

<!-- Please validate your theme's compatibility with the latest versions often, as we will remove themes that have become unsupported. -->

Based on Spotify's original theme.

## Screenshots

<div align="center">
  <img src="screenshots/turntable.png" alt="turntable">
</div>
<div align="center">
  <img src="screenshots/fad.png" alt="full app display">
</div>
<div align="center">
  <img src="screenshots/fad_vertical.png" alt="full app display - vertical mode">
</div>

### Info

Designed and developed by [Grason Chan](https://github.com/grasonchan).

The turntable was inspired by [Netease Music](https://music.163.com) and [Smartisan OS build-in Music Player](https://www.smartisan.com/os/#/beauty) (not include code).

**Note:** Require Spicetify **v2.2.0** or higher! Otherwise, performance problems will happen when the turntable rotates!

View the **CHANGELOG** [here](https://github.com/grasonchan/spotify-spice/blob/master/CHANGELOG.md).

### Installation

1. add extension - [Full App Display](https://spicetify.app/docs/getting-started/extensions#full-app-display)

```shell
spicetify config extensions fullAppDisplay.js
spicetify apply
```

2. put **Turntable** and **turntable.js** into the **.config/spicetify**

```shell
cd spicetify-themes
cp -r Turntable ~/.config/spicetify/Themes
cp Turntable/turntable.js ~/.config/spicetify/Extensions
```

3. select the theme and extension, then apply

```shell
spicetify config current_theme Turntable
spicetify config extensions turntable.js
spicetify apply
```

### How to Uninstall

1. remove **Turntable** and **rotateTurntable.js**

```shell
rm -r ~/.config/spicetify/Themes/Turntable
rm ~/.config/spicetify/Extensions/turntable.js
```

2. config to spicetify default theme

```shell
spicetify config current_theme SpicetifyDefault
```

3. remove extension - Full App Display and Turntable(optional)

```shell
spicetify config extensions fullAppDisplay.js-
spicetify config extensions turntable.js-
```

4. apply

```shell
spicetify apply
```
