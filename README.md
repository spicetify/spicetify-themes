# spicetify community themes

This is a collection of themes for [spicetify](https://github.com/khanhas/spicetify-cli), a command-line tool to customize Spotify; you can add your own theme simply by opening a Pull Requests (more info in the Contributions section).

### **You can find a preview of all the themes in [THEMES.md](./THEMES.md).**

**New Spotify UI (>v1.1.56) and Spicetify >v2 are required**

## Installation and usage

(If you use Arch Linux you can find this project on the [AUR](https://aur.archlinux.org/packages/spicetify-themes-git/))

Once you cloned the repository you'll need to put the files into the Themes folder. This varies between operating systems. The example shows the `Themes` directory for Linux. For other operating systems, see the `Themes` folder location [here](https://github.com/khanhas/spicetify-cli/wiki/Customization#themes).

```bash
cd spicetify-themes
cp -r * ~/.config/spicetify/Themes
```

**NOTE: to install Dribbblish and DribbblishDynamic follow the instructions in its README**.

After that you can choose which theme to apply just by running `spicetify config current_theme THEME_NAME`.
Some themes have 2 or more different color schemes. You can switch between them, once selected the theme, with `spicetify config color_scheme SCHEME_NAME`.

## Contributions

We've set up a separate document for our [contribution guidelines](./CONTRIBUTING.md).

## Troubleshooting

Do not open issues for general support questions as we want to keep GitHub issues for bug reports and feature requests. If you find problems when using or installing these themes, or you need help in modifying a theme use the [Spectrum](https://spectrum.chat/spicetify) chat.

Use GitHub issues ONLY for bugs and requesting new features.

If you are unsure about which channel to use, go for Spectrum.

NOTE: Spotify ad-blocked version is not supported.

## FAQ 

### How can I remove free version UI elements (e.g. "Upgrade" button)?

Use [this theme](https://github.com/Daksh777/SpotifyNoPremium).
