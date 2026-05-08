param(
  [Parameter(Mandatory=$true)][string]$InputFile,
  [Parameter(Mandatory=$true)][string]$OutputDir
)

$ErrorActionPreference = 'Stop'

# Resolve paths to absolute (PowerPoint COM doesn't accept relative)
$inAbs  = (Resolve-Path -LiteralPath $InputFile).ProviderPath
if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}
$outAbs = (Resolve-Path -LiteralPath $OutputDir).ProviderPath

Write-Host "Converting: $inAbs -> $outAbs"

$ppt = New-Object -ComObject PowerPoint.Application
try {
  # 0 = msoFalse (don't ask to save). msoTrue = -1
  $pres = $ppt.Presentations.Open($inAbs, $true, $true, $false)
  # 17 = ppSaveAsJPG. Width/Height in pixels.
  $pres.SaveAs($outAbs, 17)
  $pres.Close()
  Write-Host "Done: $OutputDir"
} finally {
  $ppt.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
