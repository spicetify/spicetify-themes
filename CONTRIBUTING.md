# Contributing guidelines

To measure theme popularity, one thing that we must ask of you is that **each one of your themes is developed within a repository of its own**.

## Before contributing

A theme name (as well as color scheme name) should consist of one word starting with an uppercase letter and shouldn't contain `spicetify` or any whitespace in it; if a "-" is present in the name it must be followed by an uppercase letter.

## How to contribute

If you want your theme to show up on **Spicetify Marketplace**, you will need to create a Pull Request to this repository with the following structure:

```
.
├── ...
├── THEME_NAME                  # Folder with your theme name.
│   ├── screenshots             # Folder with theme screenshots.
│   ├── manifest.json           # Manifest file with the structure detailed below.
│   └── README.md               # Readme file with the theme description.
└── ...
```

For this, you'll need:

1. Fork this repository
2. Create another folder named after your theme name
3. Create a `README.md` in it with the following structure

   ```markdown
   # THEME_NAME

    <p align="center">
      <a href="https://github.com/spicetify/spicetify-cli"><img src="https://img.shields.io/badge/Spicetify-2.9.9-eb5a37"></a>
      <a href="https://github.com/spicetify/spicetify-cli"><img src="https://img.shields.io/badge/Spotify-1.1.85-1DB954"></a>
    </p>

    <!-- Please validate your theme's compatibility with the latest versions often, as we will remove themes that have become unsupported. -->

   Description of your theme.

    <!-- Below this line you are open to organizing your theme as you please -->

   ## Screenshots

   [Put at least one image per color scheme here]

   ## More

   [Specify any needed font; (optionally) author name and/or any other info about the theme]
   ```

4. Add the theme preview to [THEMES.md](./THEMES.md) (themes are in alphabetical order) following this structure if it has only one color scheme:

```markdown
## THEME_NAME

[A single image of the theme]
```

If, instead, more than one color scheme is present:

```markdown
## THEME_NAME

|                                         |                                       |
| :-------------------------------------: | :-----------------------------------: |
| ![light]([THEME]/screenshots/light.png) | ![dark]([THEME]/screenshots/dark.png) |
|                  light                  |                 dark                  |

...
```

> _Note_: All screenshots must be in PNG format and, additionally, must be uploaded to this repository.

5. Commit only once, more details in the **Commit Message**
6. Open a Pull Request and mention the most important changes you've made to the UI (ignoring the color scheme)

**Thanks to all the contributors.**

## Commit Message

**NOTE: commit only once when you add a new theme or scheme (you can also commit again later if you need to).**

### Format

    <type>(<scope>): <subject>
    <BLANK LINE>
    <body>[optional]

**Any line of the commit message cannot be longer than 100 characters!**

- **type:** feat | fix | docs | chore
  - **feat:** A new theme | A new scheme | A new feature
  - **fix:** A bug fix
  - **docs:** Change the `README.md` of the theme | Change the `THEMES.md`
  - **chore:** Add more screenshots | Change the screentshots | Other things
- **scope:** THEMES | `<ThemeName>`
  - THEMES is a fixed format: `docs(THEMES)`
  - In other cases, use the theme name
- **subject:** What changes you have done
  - Use the imperative, present tense: "change" not "changed" nor "changes"
  - Don't capitalize the first letter
  - No dot (.) at the end
- **body**: More details of your changes, you can mention the most important changes here

### Example (Turntable theme)

- feat

  ```
  feat(Turntable): add Turntable theme
  ```

  ```
  feat(Turntable): control the rotation of the turntable

  Rotate the turntable by playing state.
  ```

- fix

  ```
  fix(Turntable): show the cursor outside the context menu
  ```

- docs

  ```
  docs(Turntable): update README.md
  ```

  ```
  docs(THEMES): add preview for the Turntable
  ```

- chore

      ```
      chore(Turntable): add screenshots of the Turntable
      ```

  If you want to learn more, view the [Angular - Git Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines).
