# uninstall.ps1 — Remove Obsidian Theme

$ThemeName = "Obsidian"
$DestPath = "$env:APPDATA\spicetify\Themes\$ThemeName"

Write-Host "Uninstalling theme: $ThemeName"

# Remove theme folder
if (Test-Path $DestPath) {
    Remove-Item -Path $DestPath -Recurse -Force
}

# Reset Spicetify config
spicetify config current_theme ""
spicetify config color_scheme ""

# Restore Spotify defaults
spicetify restore

Write-Host "Obsidian theme removed and Spotify restored."
