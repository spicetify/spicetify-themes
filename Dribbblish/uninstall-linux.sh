#!/usr/bin/env bash

# Clear current theme
spicetify config current_theme ""

# Get Spicetify config path
CONFIG_PATH=$(spicetify -c)

# Create a backup for safety
cp "$CONFIG_PATH" "$CONFIG_PATH.bak"

# Remove xpui.js_find_8008 line
sed -i '/xpui.js_find_8008/d' "$CONFIG_PATH"

# Remove xpui.js_repl_8008 line
sed -i '/xpui.js_repl_8008/d' "$CONFIG_PATH"

# Apply changes
spicetify apply

