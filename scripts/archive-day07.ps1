param(
  [Parameter(Mandatory=$true)][ValidateSet('Create','Extract')][string]$Mode,
  [Parameter(Mandatory=$true)][ValidateSet('site','source')][string]$Kind,
  [ValidatePattern('^[a-z0-9-]*$')][string]$Suffix = ''
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$archive = [IO.Path]::GetFullPath((Join-Path $workspace "release/day07/engineering-atlas-$Kind.zip"))
$stage = [IO.Path]::GetFullPath((Join-Path $workspace "tmp/day07/package-stage/$Kind"))
$folder = if ($Suffix) { "extracted-$Kind-$Suffix" } else { "extracted-$Kind" }
$extracted = [IO.Path]::GetFullPath((Join-Path $workspace "tmp/day07/$folder"))
foreach ($target in @($archive,$stage,$extracted)) {
  if (-not ([IO.Path]::GetFullPath($target).StartsWith($workspace + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase))) {
    throw 'Archive operation escaped the intended workspace'
  }
}
if ($Mode -eq 'Create') {
  if (Test-Path -LiteralPath $archive) { throw 'Archive exists; preserve it before a new attempt' }
  [IO.Compression.ZipFile]::CreateFromDirectory($stage,$archive,[IO.Compression.CompressionLevel]::Optimal,$false)
  [pscustomobject]@{Path=$archive;Bytes=(Get-Item -LiteralPath $archive).Length;SHA256=(Get-FileHash -LiteralPath $archive).Hash.ToLowerInvariant()} | ConvertTo-Json
} else {
  if (Test-Path -LiteralPath $extracted) { throw 'Extraction destination exists; use a fresh destination' }
  $zip = [IO.Compression.ZipFile]::OpenRead($archive)
  try {
    foreach ($entry in $zip.Entries) {
      $destination=[IO.Path]::GetFullPath((Join-Path $extracted $entry.FullName))
      if (-not $destination.StartsWith($extracted + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe ZIP entry path' }
    }
  } finally { $zip.Dispose() }
  [IO.Compression.ZipFile]::ExtractToDirectory($archive,$extracted)
  $manifest=Get-Content -Raw -LiteralPath (Join-Path $workspace 'release/day07/package-manifest.json') | ConvertFrom-Json
  $expected=$manifest.$Kind
  $actual=@(Get-ChildItem -LiteralPath $extracted -Recurse -File -Force)
  if ($actual.Count -ne $expected.Count) { throw 'Extracted file count mismatch' }
  foreach ($record in $expected) {
    $path=Join-Path $extracted $record.path
    if ((Get-FileHash -LiteralPath $path).Hash.ToLowerInvariant() -ne $record.sha256) { throw "Extracted hash mismatch: $($record.path)" }
  }
  [pscustomobject]@{Kind=$Kind;Files=$expected.Count;AllHashesMatch=$true;Root=$extracted} | ConvertTo-Json
}
