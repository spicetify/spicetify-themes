# Enable TLS 1.2 since it is required for connections to GitHub
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "Beginning installation of spicetify-fluent"
Write-Host "https://github.com/nimsandu/spicetify-bloom"

# Give time for user to cancel via CTRL+C
Start-Sleep -s 3

$checkSpice = Get-Command spicetify -ErrorAction Silent
if ($null -eq $checkSpice) {
  Write-Host -ForegroundColor Red "Spicetify not found. Installing that for you..."
  Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/khanhas/spicetify-cli/master/install.ps1" | Invoke-Expression
}

# Check if ~\.spicetify-cli\Themes\bloom directory exists
$spicePath = spicetify -c | Split-Path
$themePath = "$spicePath\Themes\bloom"
if (-not (Test-Path $themePath)) {
  Write-Host "Creating bloom theme folder..."
  New-Item -Path $themePath -ItemType Directory | Out-Null
} else {
  # Remove pre-existing files, only keep the newest files
  Remove-Item "$themePath\*" -Recurse -Force
}

# Download latest master
$zipUri = "https://github.com/nimsandu/spicetify-bloom/archive/refs/heads/master.zip"
$zipSavePath = "$themePath\bloom-main.zip"
Write-Host "Downloading spicetify-bloom latest master..."
Invoke-WebRequest -Uri $zipUri -UseBasicParsing -OutFile $zipSavePath

# Extract theme from .zip file
Write-Host "Extracting..."
Expand-Archive -Path $zipSavePath -DestinationPath $themePath -Force
Get-ChildItem "$themePath\spicetify-bloom-main\*" | ForEach-Object { Move-Item $_ $themePath }
Remove-Item "$themePath\spicetify-bloom-main"

# Delete .zip file
Write-Host "Deleting zip file..."
Remove-Item -Path $zipSavePath

# Change Directory to the Theme Folder
Set-Location $themePath

# Copy the bloom.js to the Extensions folder
Copy-Item bloom.js ..\..\Extensions
Write-Host "+ Installed bloom.js theme"

# Apply the theme with spicetify config calls
spicetify config extensions bloom.js
spicetify config current_theme bloom
spicetify config color_scheme dark
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1
Write-Host "+ Configured bloom theme"

# Patch the xpui.js for sidebar fixes
# credit: https://github.com/JulienMaille/dribbblish-dynamic-theme/blob/main/install.ps1
$configFile = Get-Content "$spicePath\config-xpui.ini"
if (-not ($configFile -match "xpui.js_find_8008")) {
  $rep = @"
[Patch]
xpui.js_find_8008=,(\w+=)32,
xpui.js_repl_8008=,`${1}58,
"@
  # In case missing Patch section
  if (-not ($configFile -match "\[Patch\]")) {
    $configFile += "`n[Patch]`n"
  }
  $configFile = $configFile -replace "\[Patch\]",$rep
  Set-Content "$spicePath\config-xpui.ini" $configFile
}
Write-Host "+ Patched xpui.js for Sidebar fixes"

# backup apply or just apply where necessary
# credit: https://github.com/JulienMaille/dribbblish-dynamic-theme/blob/main/install.ps1
$backupVer = $configFile -match "^version"
$version = ConvertFrom-StringData $backupVer[0]
if ($version.version.Length -gt 0) {
  spicetify apply
} else {
  spicetify backup apply
}
Write-Host "+ Applied Theme"