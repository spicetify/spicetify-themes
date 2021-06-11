# Contributing guidelines

Here are the guidelines for contributing to this repository.

## Before contributing

For avoiding having too many similar themes with small changes, themes are merged only if they bring **sensitive** changes to default Spotify UI and are different from existing themes.

A theme name (as well as color scheme name) should consist of one word starting with an uppercase letter and shouldn't contain `spicetify` or any whitespace in it; if a "-" is present in the name it must be followed by an uppercase letter.

## How to contribute

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
*   Commit only once, more details in the **Commit Message**
*   Open a Pull Request and mention the most important changes you've made to the UI (ignoring the color scheme)

**Thanks to all the contributors.**

## Commit Message

**NOTE: commit only once when you add a new theme or scheme (you can also commit again later, if you need to).**

### Format

    <type>(<scope>): <subject>
    <BLANK LINE>
    <body>[optional]

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

### Example (Turntable theme)

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
