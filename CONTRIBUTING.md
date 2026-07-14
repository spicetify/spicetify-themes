# Contributing guidelines

This repository no longer accepts **new theme submissions**.

If you want to publish a new theme, please use the Marketplace publishing guide instead:

https://github.com/spicetify/marketplace/wiki/Publishing-to-Marketplace

We still accept patches and fixes for **existing themes** in this repository.

## Before contributing

Only contributions that improve or fix an existing theme in this repository are accepted.

A theme name (as well as color scheme name) should consist of one word starting with an uppercase letter and shouldn't contain `spicetify` or any whitespace in it; if a "-" is present in the name it must be followed by an uppercase letter.

## How to contribute

If you want to update an existing theme:

* Fork this repository
* Make your changes inside the existing theme folder
* Update screenshots or documentation if needed
* Commit only once when possible, more details in the **Commit Message** section
* Open a Pull Request and mention the most important fixes or patches you've made

**Thanks to all the contributors.**

## Commit Message

**NOTE: commit only once when you add a fix or patch (you can also commit again later, if you need to).**

### Format

    <type>(<scope>): <subject>
    <BLANK LINE>
    <body>[optional]

**Any line of the commit message cannot be longer than 100 characters!**

* **type:** feat | fix | docs | chore
    * **feat:** A new feature for an existing theme
    * **fix:** A bug fix
    * **docs:** Change the `README.md` of the theme | Change the `THEMES.md`
    * **chore:** Add more screenshots | Change the screenshots | Other things
* **scope:** THEMES | `<ThemeName>`
    * THEMES is a fixed format: `docs(THEMES)`
    * In other cases, use the theme name
* **subject:** What changes you have done
    * Use the imperative, present tense: "change" not "changed" nor "changes"
    * Don't capitalize first letter
    * No dot (.) at the end
* **body**: More details of your changes, you can mention the most important changes here

### Example (Turntable theme)

* feat

    ```
    feat(Turntable): add playback toggle behavior
    ```

    ```
    feat(Turntable): improve turntable rotation behavior

    Rotate the turntable by playing state.
    ```

* fix

    ```
    fix(Turntable): show the cursor outside the context menu
    ```

* docs

    ```
    docs(Turntable): update README.md
    ```

    ```
    docs(THEMES): add preview for the Turntable
    ```

* chore

    ```
    chore(Turntable): add screenshots of the Turntable
    ```

If you want to learn more, view the [Angular - Git Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines).
