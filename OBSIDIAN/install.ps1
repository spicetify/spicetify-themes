# install.ps1 — Install OBSIDIAN Theme

$ThemeName = "OBSIDIAN"
$SourcePath = "$PSScriptRoot\$ThemeName"
$DestPath = "$env:APPDATA\spicetify\Themes\$ThemeName"

Write-Host "Installing theme: $ThemeName"

# Ensure Themes directory exists
if (!(Test-Path "$env:APPDATA\spicetify\Themes")) {
    New-Item -ItemType Directory -Path "$env:APPDATA\spicetify\Themes" | Out-Null
}

# Copy theme folder
Copy-Item -Path $SourcePath -Destination $DestPath -Recurse -Force

# Configure Spicetify to use OBSIDIAN
spicetify config current_theme $ThemeName
spicetify config color_scheme "Dark"

# Backup + apply
spicetify backup apply

Write-Host "OBSIDIAN theme installed and applied."
