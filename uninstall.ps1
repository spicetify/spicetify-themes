spicetify config current_theme " " extensions dribbblish.js- extensions dribbblish-dynamic.js- extensions Vibrant.min.js-

$spicePath = spicetify -c | Split-Path
$configFile = Get-Content "$spicePath\config-xpui.ini"
$find = $configFile -match "xpui.js_find_8008"
if ($find) {
    $configFile = $configFile -replace [regex]::escape($find),""
}
$repl = $configFile -match "xpui.js_repl_8008"
if ($repl) {
    $configFile = $configFile -replace [regex]::escape($repl),""
}
Set-Content "$spicePath\config-xpui.ini" $configFile

spicetify apply
