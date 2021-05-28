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

### Before contributing

For avoiding having too many similar themes with small changes, themes are merged only if they bring **sensitive** changes to default Spotify UI and are different from existing themes.

A theme name (as well as color scheme name) should consist of one word starting with an uppercase letter and shouldn't contain `spicetify` or any whitespace in it; if a "-" is present in the name it must be followed by an uppercase letter.

### How to contribute

If you want to add your theme:

*   Fork this repository
*   Create another folder named after your theme name
*   Create `color.ini` and `user.css` files
*   Create a `README.md` in it with the following structure

    ```markdown
    # THEME_NAME

    ## Screenshots

    [Put at least one image per color scheme here]

    ## More

    [Specify any needed font; (optionally) author name and/or any other info about the theme]
    ```
*   Add the theme preview to [THEMES.md](./THEMES.md) (themes are in alphabetical order) following this structure if it has only one color scheme

    ```markdown

    ## THEME_NAME

    [A single image of the theme]
    ```

    If, instead, more than one color scheme is present

    ```markdown
    ## THEME_NAME

    #### COLOR_SCHEME1_NAME 

    [A single image of the theme using the color scheme]

    #### COLOR_SCHEME2_NAME

    [A single image of the theme using the color scheme]

    ...
    ```
*   Commit only one message, more details in the **Commit Message**
*   Open a Pull Request and mention the most important changes you've made to the UI (ignoring the color scheme)

**Thanks to all the contributors.**

### Commit Message

**NOTE: commit only one message when you add a new theme or scheme, you can commit other messages later.**

#### Format

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>[optional]
```

**Any line of the commit message cannot be longer than 100 characters!**

*   **type:** feat | fix | docs | chore
    *   **feat:** A new theme | A new scheme | A new feature
    *   **fix:** A bug fix
    *   **docs:** Change the `README.md` of the theme | Change the `THEMES.md`
    *   **chore:** Add more screenshots | Change the screentshots | Other things
*   **scope:** THEMES | `<ThemeName>`
    *   THEMES is a fixed format: `docs(THEMES)`
    *   In other cases, use the theme name
*   **subject:** What changes you have done
    *   Use the imperative, present tense: "change" not "changed" nor "changes"
    *   Don't capitalize first letter
    *   No dot (.) at the end
*   **body**: More details of your changes, you can mention the most important changes here

#### Example (Turntable theme)

*   feat

```
feat(Turntable): add Turntable theme
```

```
feat(Turntable): control the rotation of the turntable

Rotate the turntable by playing state.
```

*   fix

```
fix(Turntable): show the cursor outside the context menu
```

*   docs

```
docs(Turntable): update README.md
```

```
docs(THEMES): add preview for the Turntable
```

*   chore

```
chore(Turntable): add screenshots of the Turntable
```

If you want to learn more, view the [Angular - Git Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines).

## Troubleshooting

If you find problems when using or installing these themes, or you need help in modifying a theme use the [Spectrum](https://spectrum.chat/spicetify) chat.

For bugs and requesting new features use the GitHub issues.

If you are unsure about which channel to use, go for Spectrum.

NOTE: Spotify ad-blocked version is not supported.
