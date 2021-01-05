# spicetify community themes

This is a collection of themes for [spicetify](https://github.com/khanhas/spicetify-cli), a command-line tool to customize Spotify; you can add your own theme simply by opening a Pull Requests (more info in the Contributions section).

### **You can find a preview of all the themes in the [wiki](https://github.com/morpheusthewhite/spicetify-themes/wiki/Themes-preview).**

## Installation

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

If you want to add your theme:

- Fork this repository
- Create another folder with your theme name. The theme name should consist of one word starting with an uppercase letter and shouldn't contain `spicetify` or any whitespace in it; if a "-" is present in the name it must be followed by an uppercase letter.
- Copy `color.ini` and `user.css` into it
- Create a `README.md` in it with the following structure 
```markdown
# THEME_NAME

## Screenshots

[Put at least one image per color scheme here]

## More

[Specify any needed font; (optionally) author name and/or any other info about the theme]

```
- Open a Pull Request

**Thanks to all the contributors.**

## Troubleshooting

If you find problems when using or installing these themes, or you need help in modifying a theme 
use the [Spectrum](https://spectrum.chat/spicetify) chat. 

For bugs and requesting new features use the GitHub issues. 

If you are unsure about which channel to use, go for Spectrum.

NOTE: Spotify ad-blocked version is not supported.
