#Requires -Version 5.0

#region Console helpers
function Write-Center {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$Message,
        
        [string]$ForegroundColor = $Host.UI.RawUI.ForegroundColor
    )
    process {
        $freeSpace = $Host.UI.RawUI.BufferSize.Width - $Message.Length
        $spaces = ' ' * [Math]::Floor($freeSpace / 2)
        Write-Host -Object ($spaces + $Message + $spaces) -ForegroundColor $ForegroundColor
    }
}

function Write-HelloMessage {
    [CmdletBinding()]
    param ()
    process {
        Write-Host
        Write-Center -Message '----------------------------------------' -ForegroundColor Blue
        Write-Center -Message 'Starting the Spicetify better-bloom script...' -ForegroundColor Blue
        Write-Host
        Write-Center -Message 'github.com/sanoojes/better-bloom' -ForegroundColor Blue
        Write-Center -Message '----------------------------------------' -ForegroundColor Blue
        Write-Host
    }
}

function Write-Error {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$Message
    )
    process {
        Write-Host -Object $Message -ForegroundColor Red
    }
    end {
        Wait-Input
        exit 1
    }
}

function Write-ByeMessage {
    [CmdletBinding()]
    param ()
    process {
        Write-Host
        Write-Center -Message '----------------------------------------' -ForegroundColor Green
        Write-Center -Message 'No errors!' -ForegroundColor Green
        Write-Host
        Write-Center -Message 'Thanks for using better-bloom!' -ForegroundColor Green
        Write-Center -Message '----------------------------------------' -ForegroundColor Green
        Write-Host
    }
}

function Wait-Input {
    [CmdletBinding()]
    param ()
    process {
        Write-Host -Object 'Press any key to continue...'
        $Host.UI.RawUI.Flushinputbuffer()
        $Host.UI.RawUI.ReadKey('NoEcho, IncludeKeyDown') | Out-Null
    }
}
#endregion Console helpers

#region Spotify
function Test-Spotify {
    [CmdletBinding()]
    [OutputType([bool])]
    param ()
    begin {
        Write-Verbose -Message 'Checking if Spotify is installed...' -Verbose
    }
    process {
        $desktopApp = Test-Path -Path "$env:APPDATA/Spotify" -PathType Container
        $storeApp = Get-AppxPackage -Name '*SpotifyAB*'
    }
    end {
        $desktopApp -or $storeApp
    }
}

function Test-SpotifyBackup {
    [CmdletBinding()]
    [OutputType([bool])]
    param (
        [Parameter(Mandatory)]
        [string]$Path
    )
    begin {
        Write-Verbose -Message 'Checking if there is up-to-date Spotify backup...' -Verbose
    }
    process {
        $configFile = Get-Content -Path $Path
        $configFile | ForEach-Object -Process {
            if ($PSItem -match '^version = (.+)$') {
                $backupVersion = $Matches[1]
            }
            elseif ($PSItem -match '^prefs_path.+= (.+)$') {
                $spotifyPrefsPath = $Matches[1]
            }
        }
        
        $spotifyPrefs = Get-Content -Path $spotifyPrefsPath
        $spotifyPrefs | ForEach-Object -Process {
            if ($PSItem -match '^app.last-launched-version="(.+)"$') {
                $spotifyVersion = $Matches[1]
            }
        }
    }
    end {
        $backupVersion -eq $spotifyVersion
    }
}

function Install-Spotify {
    [CmdletBinding()]
    param ()
    begin {
        $installerPath = "$env:TEMP\SpotifySetup.exe"
    }
    process {
        Write-Verbose -Message 'Downloading the Spotify installer...' -Verbose
        $Parameters = @{
            UseBasicParsing = $true
            Uri             = 'https://download.scdn.co/SpotifySetup.exe'
            OutFile         = $installerPath
        }
        Invoke-WebRequest @Parameters
        
        Write-Host
        Write-Host -Object 'ATTENTION!' -ForegroundColor Yellow
        Write-Host -Object 'Do not close the Spotify installer!'
        Write-Host -Object 'Once Spotify is installed, please login. Then close the window.'
        Wait-Input
        
        Write-Host
        Write-Verbose -Message 'Starting the Spotify installer...' -Verbose
        Start-Process -FilePath $installerPath
        
        while (-not (Get-Process -Name Spotify -ErrorAction SilentlyContinue)) {
            Start-Sleep -Seconds 1
        }
        Wait-Process -Name Spotify
    }
}
#endregion Spotify

#region Spicetify
function Test-Spicetify {
    [CmdletBinding()]
    [OutputType([bool])]
    Param ()
    Begin {
        Write-Verbose -Message 'Checking if Spicetify is installed...' -Verbose
    }
    Process {
        [bool](Get-Command -Name spicetify -ErrorAction SilentlyContinue) 
    }
}

function Install-Spicetify {
    [CmdletBinding()]
    param ()
    begin {
        Write-Verbose -Message 'Starting the Spicetify installation script...' -Verbose
    }
    process {
        $Parameters = @{
            UseBasicParsing = $true
            Uri             = 'https://raw.githubusercontent.com/spicetify/spicetify-cli/master/install.ps1'
        }
        Invoke-WebRequest @Parameters | Invoke-Expression
    }
}

function Install-Marketplace {
    [CmdletBinding()]
    param ()
    begin {
        Write-Verbose -Message 'Starting the Spicetify Marketplace installation script...' -Verbose
    }
    process {
        $Parameters = @{
            UseBasicParsing = $true
            Uri             = (
                'https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/resources/install.ps1'
            )
        }
        Invoke-WebRequest @Parameters | Invoke-Expression
    }
}

function Get-SpicetifyFoldersPaths {
    [CmdletBinding()]
    [OutputType([hashtable])]
    param ()
    begin {
        Write-Verbose -Message 'Getting the Spicetify folders paths...' -Verbose
    }
    process {
        @{
            configPath = (spicetify path -c)
            bloomPath  = "$(spicetify path userdata)\Themes\better-bloom"
        }
    }
}

function Submit-SpicetifyConfig {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$Path
    )
    begin {
        Write-Verbose -Message 'Applying changes...' -Verbose
    }
    process {
        if (Test-SpotifyBackup -Path $Path) {
            spicetify apply
        }
        else {
            spicetify backup apply
        }
    }
}
#endregion Spicetify

#region Misc
function Get-WindowsAppsTheme {
    [CmdletBinding()]
    param ()
    begin {
        Write-Verbose -Message 'Getting current Windows apps theme...' -Verbose
        $Parameters = @{
            Path = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize'
            Name = 'AppsUseLightTheme'
        }
    }
    process {
        switch (Get-ItemPropertyValue @Parameters) {
            0 { 'darkmono' }
            1 { 'light' }
        }
    }
}

function Get-ThemeType {
    [CmdletBinding()]
    [OutputType([string])]
    param (
        [Parameter(Mandatory)]
        [string]$Path
    )
    begin {
        Write-Verbose -Message 'Detecting current installation type...' -Verbose
    }
    process {
        $userCssData = Get-Content -Path "$Path\user.css"
    }
    end {
        if ($userCssData -like '*@import*') {
            'Remote'
        }
        else {
            'Local'
        }
    }
}
#endregion Misc

#region better-bloom
function Get-BetterBloom {
    [CmdletBinding()]
    [OutputType([string])]
    param ()
    begin {
        $archiveName = 'better-bloom-main'
        $archivePath = "$env:TEMP\$archiveName.zip"
    }
    process {
        Write-Verbose -Message 'Downloading the better-bloom repository archive...' -Verbose
        $Parameters = @{
            UseBasicParsing = $true
            Uri             = 'https://codeload.github.com/sanoojes/better-bloom/zip/refs/heads/main'
            OutFile         = $archivePath
        }
        Invoke-WebRequest @Parameters
        
        Write-Verbose -Message 'Unpacking the better-bloom repository archive...' -Verbose
        $Parameters = @{
            Path            = $archivePath
            DestinationPath = $env:TEMP
            Force           = $true
        }
        Expand-Archive @Parameters 
    }
    end {
        "$env:TEMP\$archiveName"
        Remove-Item -Path $archivePath -Force
    }
}

function Install-BetterBloom {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$Path,
        
        [Parameter(Mandatory)]
        [string]$Destination,
        
        [Parameter(Mandatory)]
        [string]$Config,
        
        [ValidateSet('Remote', 'Local')]
        [string]$Type = 'Remote',
        
        [string]$ColorScheme
    )
    begin {
        Write-Verbose -Message 'Installing better-bloom theme...' -Verbose
        $bloomSrcPath = "$Path\src"
        $bloomRemotePath = "$Path\remote"
    }
    process {
        New-Item -Path $Destination -ItemType Directory -Force | Out-Null
        
        if ($Type -eq 'Remote') {
            $Parameters = @{
                Path        = "$bloomSrcPath\color.ini"
                Destination = $Destination
                Force       = $true
            }
            Move-Item @Parameters
            
            $Parameters = @{
                Path        = "$bloomRemotePath\*"
                Destination = $Destination
                Force       = $true
            }
            Move-Item @Parameters
        }
        else {
            $Parameters = @{
                Path        = $bloomSrcPath
                Destination = $Destination
                Force       = $true
            }
            Move-Item @Parameters
        }
        
        spicetify config inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1
        spicetify config current_theme 'better-bloom'
        
        if ($ColorScheme) {
            spicetify config color_scheme $ColorScheme
        }
        
        Submit-SpicetifyConfig -Path $Config
    }
    end {
        Remove-Item -Path $Path -Recurse -Force
    }
}

function Uninstall-BetterBloom {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$Path,
        
        [Parameter(Mandatory)]
        [string]$Config,
        
        [string]$Value = ' '
    )
    begin {
        Write-Verbose -Message 'Uninstalling better-bloom theme...' -Verbose
    }
    process {
        spicetify config current_theme $Value color_scheme $Value
        Submit-SpicetifyConfig -Path $Config
    }
    end {
        Remove-Item -Path $Path -Recurse -Force
    }
}
#endregion better-bloom
