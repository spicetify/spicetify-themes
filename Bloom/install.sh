#!/bin/sh

set -e

echo "Beginning installation of spicetify-bloom"
echo "https://github.com/nimsandu/spicetify-bloom"

# Give time for user to cancel via CTRL+C
sleep 3s

# Check if ~\.spicetify-cli\Themes\bloom directory exists
spicePath=dirname "$(spicetify -c)"
themePath=dirname "$spicePath/Themes/bloom"
if [ ! -d $themePath ]; then
    echo "Creating bloom theme folder..."
    mkdir -p $themePath
else
    # Remove pre-existing files, only keep the newest files
    rm -rfv "$themePath/*"
fi

# Download latest master
zipUri="https://github.com/nimsandu/spicetify-bloom/archive/refs/heads/master.zip"
zipSavePath="$themePath/bloom-main.zip"
echo "Downloading bloom-spicetify latest master..."
curl --fail --location --progress-bar --output "$zipUri" "$zipSavePath"


# Extract theme from .zip file
echo "Extracting..."
unzip -d "$themePath" -o "$zipSavePath"
mv "$themePath/spicetify-bloom-main/*" $themePath
rmdir "$themePath/spicetify-bloom-main"

# Delete .zip file
echo "Deleting zip file..."
rm "$zipSavePath"

# Change Directory to the Theme Folder
cd $themePath

# Copy the fluent.js to the Extensions folder
mkdir -p ../../Extensions
cp fluent.js ../../Extensions/.
echo "+ Installed bloom.js extension"

# Apply the theme with spicetify config calls
spicetify config extensions bloom.js
spicetify config current_theme bloom
spicetify config color_scheme dark
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1
echo "+ Configured Bloom theme"

# Patch the xpui.js for sidebar fixes
# credit: https://github.com/JulienMaille/dribbblish-dynamic-theme/blob/main/install.sh
PATCH='[Patch]
xpui.js_find_8008 = ,(\\w+=)32,
xpui.js_repl_8008 = ,\${1}58,'
if cat config-xpui.ini | grep -o '\[Patch\]'; then
    perl -i -0777 -pe "s/\[Patch\].*?($|(\r*\n){2})/$PATCH\n\n/s" config-xpui.ini
else
    echo -e "\n$PATCH" >> config-xpui.ini
fi
echo "+ Patched xpui.js for Sidebar fixes"

spicetify apply
echo "+ Applied Theme"
