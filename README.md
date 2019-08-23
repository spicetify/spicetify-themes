# spicetify community themes

Here you can find a collection of themes for [spicetify](https://github.com/khanhas/spicetify-cli), a command-line tool to customize Spotify; you can add your own theme simply by opening a Pull Requests (more info in the Contributions section).

## Installation

To install the themes in this repository, after cloning it, just run

```bash
cd spicetify-themes
cp -r * ~/.config/spicetify/Themes
```

After that you can choose which theme to apply just by running `spicetify config current_theme THEME_NAME`

## Contributions

If you want to add your theme:

- Fork this repository
- Create another folder with your theme name
- Copy `color.ini` and `user.css` to it
- Create a `README.md` in it with the following structure 
```markdown
# THEME_NAME

## Screenshots

[Put at least one image here]

## More (optional)

[Author name and/or any other info about the theme]

```
- Open a Pull Request

**Thanks to all the contributors.**
