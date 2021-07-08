# spicetify community themes

This is a collection of themes for [spicetify](https://github.com/khanhas/spicetify-cli), a command-line tool to customize Spotify. 

You can add your own theme simply by opening a Pull Request (more info in the [Contributions section](#contributions)).

### **You can find a preview of all the themes in the [wiki](https://github.com/morpheusthewhite/spicetify-themes/wiki/Themes-preview).**

## Notes:
- **These themes require you to have the old Spotify UI (<v1.1.56) and [Spicetify <v2](https://github.com/khanhas/spicetify-cli/wiki/Installation#legacy-spotify).**
- **To install Dribbblish and DribbblishDynamic, follow the instructions in their READMEs**.  
- **Spotify ad-blocked version is not supported.**

## Installation and usage

(If you use Arch Linux you can find this project on the [AUR](https://aur.archlinux.org/packages/spicetify-themes-git/))

1. Clone this repository. Make sure [git](https://git-scm.com/) is installed and run:
    ```bash
    git clone https://github.com/morpheusthewhite/spicetify-themes.git
    ```

2. Copy the files into the [Spicetify Themes folder](https://github.com/khanhas/spicetify-cli/wiki/Customization#themes). Run:
    
    **Linux**
    ```bash
    cd spicetify-themes
    cp -r * ~/.config/spicetify/Themes
    ```

    **MacOS**

    ```bash
    cd spicetify-themes
    cp -r * ~/spicetify_data/Themes
    ```

    **Windows** 

    ```powershell
    cd spicetify-themes
    cp * "$(spicetify -c | Split-Path)\Themes\"
    ```

3. Choose which theme to apply just by running: 
    ```bash
    spicetify config current_theme THEME_NAME
    ```
    Some themes have 2 or more different color schemes. After selecting the theme you can switch between them with:
    ```bash
    spicetify config color_scheme SCHEME_NAME
    ```

## Contributions

If you want to add your theme:

- Fork this repository
- Create another folder with your theme name. The theme name should consist of one word starting with an uppercase letter and shouldn't contain `spicetify` or any whitespace in it; if a "-" is present in the name it must be followed by an uppercase letter.
- Copy `color.ini` and `user.css` into it
- Create a `README.md` in it with the following structure:

    ```markdown
    # THEME_NAME

    ## Screenshots

    [Put at least one image per color scheme here]

    ## More

    [Specify any needed font; (optionally) author name and/or any other info about the theme]

    ```
- Open a Pull Request

**Thanks to all contributors.**

## Troubleshooting

- If you find problems when using or installing these themes, or you need help in modifying a theme, 
use the [Spectrum](https://spectrum.chat/spicetify) chat. 

- For bugs and requesting new features, [open an issue](https://github.com/morpheusthewhite/spicetify-themes/issues/new/choose) on GitHub.

If you are unsure about which one to use, go for Spectrum.
