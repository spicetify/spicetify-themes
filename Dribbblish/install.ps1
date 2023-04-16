$checkSpice = Get-Command spicetify -ErrorAction Silent
if ($null -eq $checkSpice) {
    Write-Host -ForegroundColor Red "Spicetify not found"
    Write-Host "Follow instruction on:", "https://spicetify.app/docs/getting-started/simple-installation#windows"
    return
}

Write-Host "Downloading themes package:" -ForegroundColor Green
$zipFile = "$env:TEMP\spicetify-themes.zip"
Invoke-WebRequest "https://github.com/spicetify/spicetify-themes/archive/refs/heads/master.zip" -OutFile $zipFile

Write-Host "Extracting themes package:" -ForegroundColor Green
$extractPath = "$env:TEMP\spicetify-themes-master"
if (Test-Path $extractPath) {
    Remove-Item $extractPath -Recurse -Force
}
Expand-Archive $zipFile -DestinationPath $env:TEMP

# Copy to personal Themes folder
$spicePath = spicetify -c | Split-Path
$dribPath = "$extractPath\Dribbblish"

$destPath = "$spicePath\Themes\Dribbblish"
if (Test-Path $destPath) {
    Remove-Item $destPath -Recurse -Force
}
Copy-Item $dribPath $destPath -Recurse

Write-Host "Configuring:" -ForegroundColor Green
spicetify
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1 current_theme Dribbblish

# Add patch
$configFile = Get-Content "$spicePath\config-xpui.ini"
if (-not ($configFile -match "xpui.js_find_8008")) {
    $rep = @"
[Patch]
xpui.js_find_8008=,(\w+=)32,
xpui.js_repl_8008=,`${1}56,
"@
    # In case missing Patch section
    if (-not ($configFile -match "\[Patch\]")) {
        $configFile += "`n[Patch]`n"
    }
    $configFile = $configFile -replace "\[Patch\]",$rep
    Set-Content "$spicePath\config-xpui.ini" $configFile
}

$backupVer = $configFile -match "^version"
$version = ConvertFrom-StringData $backupVer[0]
if ($version.version.Length -gt 0) {
    spicetify apply
} else {
    spicetify backup apply
}
