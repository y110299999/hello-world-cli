$ErrorActionPreference = "Stop"

$DownloadBaseUrl = "http://localhost:1420/downloads"
$InstallerName = "HelloWorld-windows-x64.msi"
$InstallerUrl = "$DownloadBaseUrl/$InstallerName"
$InstallerPath = Join-Path $env:TEMP $InstallerName

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Test-MsiFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return $false
  }

  $ExpectedHeader = [byte[]](0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1)
  $Stream = [System.IO.File]::OpenRead($Path)

  try {
    $Header = New-Object byte[] 8
    $BytesRead = $Stream.Read($Header, 0, $Header.Length)

    if ($BytesRead -ne $ExpectedHeader.Length) {
      return $false
    }

    for ($Index = 0; $Index -lt $ExpectedHeader.Length; $Index++) {
      if ($Header[$Index] -ne $ExpectedHeader[$Index]) {
        return $false
      }
    }

    return $true
  } finally {
    $Stream.Dispose()
  }
}

Write-Host "==> Downloading $InstallerUrl"
Invoke-WebRequest -Uri $InstallerUrl -OutFile $InstallerPath -UseBasicParsing

if (-not (Test-MsiFile $InstallerPath)) {
  throw "downloaded file is not a valid MSI package: $InstallerUrl"
}

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
