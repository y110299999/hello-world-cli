$ErrorActionPreference = "Stop"

$DownloadBaseUrl = "http://localhost:1420/downloads"
$InstallerName = "HelloWorld-windows-x64.msi"
$InstallerUrl = "$DownloadBaseUrl/$InstallerName"
$InstallerPath = Join-Path $env:TEMP $InstallerName

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "==> Downloading $InstallerUrl"
Invoke-WebRequest -Uri $InstallerUrl -OutFile $InstallerPath -UseBasicParsing

Write-Host "==> Opening Windows installer"
$Process = Start-Process `
  -FilePath "msiexec.exe" `
  -ArgumentList @("/i", $InstallerPath) `
  -Wait `
  -PassThru

if ($Process.ExitCode -ne 0) {
  throw "msiexec.exe failed with exit code $($Process.ExitCode)"
}

Write-Host "==> Hello World installed"
