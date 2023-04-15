spicetify config current_theme " "

$configPath = spicetify -c
$configFile = Get-Content $configPath
$find = $configFile -match "xpui.js_find_8008"
if ($find) {
    $configFile = $configFile -replace [regex]::escape($find),""
}
$repl = $configFile -match "xpui.js_repl_8008"
if ($repl) {
    $configFile = $configFile -replace [regex]::escape($repl),""
}
Set-Content $configPath $configFile

spicetify apply
