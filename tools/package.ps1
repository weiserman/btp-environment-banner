# Builds dist/sap-btp-environment-banner-<version>.zip (plus .sha256) from the files in
# tools/package-files.txt – the same list the GitHub release workflow uses.
# Usage: powershell -ExecutionPolicy Bypass -File tools/package.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$version = (Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json).version
$files = Get-Content (Join-Path $PSScriptRoot 'package-files.txt') | Where-Object { $_.Trim() }

$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force $dist | Out-Null
$zipName = "sap-btp-environment-banner-$version.zip"
$zip = Join-Path $dist $zipName
if (Test-Path $zip) { Remove-Item $zip }

Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($zip, 'Create')
try {
  foreach ($file in $files) {
    $source = Join-Path $root $file
    if (-not (Test-Path $source)) { throw "Missing file listed in package-files.txt: $file" }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $source, $file) | Out-Null
  }
} finally {
  $archive.Dispose()
}

$hash = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
Set-Content -Path "$zip.sha256" -Value "$hash  $zipName" -Encoding ascii
Write-Host "Built $zip ($($files.Count) files)"
Write-Host "SHA-256 $hash"
