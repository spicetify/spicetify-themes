# Bloom

<p align="center">
  <a href="https://github.com/spicetify/spicetify-cli"><img src="https://img.shields.io/badge/Spicetify-2.9.9-eb5a37"></a>
  <a href="https://github.com/spicetify/spicetify-cli"><img src="https://img.shields.io/badge/Spotify-1.1.85-1DB954"></a>
</p>

<!-- Please validate your theme's compatibility with the latest versions often, as we will remove themes that have become unsupported. -->

## Screenshots

![dark-1](screenshots/Dark-1.png)

### Important

For the sidebar playlists to show properly, ensure that these two lines are added in the Patch section of your `config-xpui.ini` file:

```ini
[Patch]
xpui.js_find_8008 = ,(\w+=)32,
xpui.js_repl_8008 = ,${1}56,
```
