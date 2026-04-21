$ErrorActionPreference = "Stop"

$CliName = "hello-world-cli"
$DownloadBaseUrl = $env:HELLO_WORLD_CLI_DOWNLOAD_BASE_URL

if ([string]::IsNullOrWhiteSpace($DownloadBaseUrl)) {
  $DownloadBaseUrl = "http://localhost:1420/downloads"
}

$InstallDir = $env:HELLO_WORLD_CLI_INSTALL_DIR

if ([string]::IsNullOrWhiteSpace($InstallDir)) {
  $InstallDir = Join-Path $HOME ".local\bin"
}

$DownloadBaseUrl = $DownloadBaseUrl.TrimEnd("/")
$BinaryName = "$CliName-windows-x64.exe"
$BinaryUrl = "$DownloadBaseUrl/$BinaryName"
$TargetPath = Join-Path $InstallDir "$CliName.exe"
$TempPath = Join-Path $env:TEMP $BinaryName

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "==> Downloading $BinaryUrl"
Invoke-WebRequest -Uri $BinaryUrl -OutFile $TempPath -UseBasicParsing

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item -LiteralPath $TempPath -Destination $TargetPath -Force
Remove-Item -LiteralPath $TempPath -Force

Write-Host "==> Installed $CliName to $TargetPath"

$PathEntries = ($env:PATH -split [IO.Path]::PathSeparator) | ForEach-Object {
  if ([string]::IsNullOrWhiteSpace($_)) {
    $_
  } else {
    [IO.Path]::GetFullPath($_).TrimEnd("\")
  }
}
$ResolvedInstallDir = [IO.Path]::GetFullPath($InstallDir).TrimEnd("\")
$PathContainsInstallDir = $PathEntries | Where-Object {
  $_ -ieq $ResolvedInstallDir
}

if (-not $PathContainsInstallDir) {
  Write-Warning "$InstallDir is not in PATH; add it before running $CliName directly."
}
