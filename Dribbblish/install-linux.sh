#!/usr/bin/env bash

set -e

# Check for spicetify
if ! command -v spicetify >/dev/null 2>&1; then
    echo "Spicetify not found"
    echo "Follow instruction on: https://spicetify.app/docs/getting-started/simple-installation#linux"
    exit 1
fi

echo "Downloading themes package..."

ZIP_FILE="/tmp/spicetify-themes.zip"
EXTRACT_PATH="/tmp/spicetify-themes-master"

curl -L \
"https://github.com/spicetify/spicetify-themes/archive/refs/heads/master.zip" \
-o "$ZIP_FILE"

echo "Extracting themes package..."

rm -rf "$EXTRACT_PATH"
unzip -q "$ZIP_FILE" -d /tmp

# Resolve spicetify config directory
SPICE_PATH="$(spicetify -c | xargs dirname)"

DRIB_PATH="$EXTRACT_PATH/Dribbblish"
DEST_PATH="$SPICE_PATH/Themes/Dribbblish"

# Copy to personal Themes folder
rm -rf "$DEST_PATH"
cp -r "$DRIB_PATH" "$DEST_PATH"

echo "Configuring..."

spicetify
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1 current_theme Dribbblish

CONFIG_FILE="$SPICE_PATH/config-xpui.ini"

# Add patch if missing
if ! grep -q "xpui.js_find_8008" "$CONFIG_FILE"; then

    if ! grep -q "^\[Patch\]" "$CONFIG_FILE"; then
        echo "" >> "$CONFIG_FILE"
        echo "[Patch]" >> "$CONFIG_FILE"
    fi

    cat >> "$CONFIG_FILE" <<EOF
xpui.js_find_8008=,(\\w+=)32,
xpui.js_repl_8008=,\\156,
EOF
fi

# Apply configuration
if grep -q "^version" "$CONFIG_FILE"; then
    spicetify apply
else
    spicetify backup apply
fi

echo "Done."
