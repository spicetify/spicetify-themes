#!/bin/bash

# Enabling strict error handling
set -e

# ANSI Color Codes
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Helper function to display error messages
print_error() {
    echo -e "${RED}$1${NC}"
}

# Helper function to display success messages
print_success() {
    echo -e "${GREEN}$1${NC}"
}

# Helper function to display info messages
print_info() {
    echo -e "${BLUE}$1${NC}"
}

# Check if Spotify is installed
if ! command -v spotify &> /dev/null; then
    print_error "Spotify isn't installed or doesn't exist in your PATH."
    print_error "Better-Bloom is a Spotify theme, and so it's essential."
    print_error "Please install Spotify (https://spotify.com/download) and run this script again to continue."
    print_error "If Spotify is already installed, add it to your PATH variable and rerun this script."
    print_error "Example command for adding to PATH: export PATH=~/spotify:\$PATH"
    print_error "Abort!"
    exit 3
fi

# Check if Spicetify is installed
if ! command -v spicetify &> /dev/null; then
    print_error "Spicetify isn't installed or doesn't exist in your PATH."
    print_error "Better-Bloom relies on it to work properly."
    print_error "Please install Spicetify (https://spicetify.app) and run this script again to continue."
    print_error "If Spicetify is already installed, add it to your PATH variable and rerun this script."
    print_error "Example command for adding to PATH: export PATH=/opt/spicetify:\$PATH"
    print_error "Abort!"
    exit 1
fi

# Check if mktemp is installed
if ! command -v mktemp &> /dev/null; then
    print_error "mktemp isn't installed or doesn't exist in your PATH."
    print_error "Mktemp is used to generate temporal paths to place the files, and so it's essential."
    print_error "Abort!"
    exit 5
fi

print_success "Beginning installation of better-bloom"
print_info "https://github.com/sanoojes/better-bloom"

print_info "Press any key to continue or Ctrl+C to cancel"
read -sn1 < /dev/tty
echo -e "\n"

# Configuring theme paths
spicePath="$(dirname "$(spicetify -c)")"
themePath="$spicePath/Themes/better-bloom"
if [ -d "$themePath" ]; then
    rm -rf "$themePath"
fi

# Additional Fedora-specific configuration
if command -v dnf &> /dev/null && dnf list installed spotify-client &> /dev/null && ! grep -q 'spotify_path' ~/.config/spicetify/config-xpui.ini; then
    sed -i '/spotify_path/ s/$/\/usr\/share\/spotify-client/' ~/.config/spicetify/config-xpui.ini
fi

# Remove old extension if exists
spicetify config extensions better-bloom.js- -q
extensionPath="$spicePath/Extensions/better-bloom.js"
if [[ -e "$extensionPath" || -h "$extensionPath" ]]; then
  rm "$extensionPath"
fi

# Download and extract the latest theme files
zipUri="https://github.com/sanoojes/better-bloom/archive/refs/heads/master.zip"
zipSavePath=$(mktemp)
zipExtractPath=$(mktemp -d)
print_info "Downloading better-bloom-spicetify latest master..."
curl --fail --location --progress-bar "$zipUri" --output "$zipSavePath"

print_info "Extracting..."
unzip -oq "$zipSavePath" -d "$zipExtractPath" < /dev/tty
mv "$zipExtractPath/better-bloom-main/src/" "$themePath"

print_info "Deleting zip file..."
rm -rf "$zipSavePath" "$zipExtractPath"

# Apply the theme with spicetify config calls
spicetify config current_theme better-bloom
spicetify config color_scheme dark
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1
print_success "+ Configured Better-Bloom theme"

# Backup and apply new configuration
spicetify backup apply
print_success "+ Applied Theme"
