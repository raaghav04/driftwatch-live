param(
    [string]$ProjectRoot = "C:\Users\L H Avinassh\Documents\proj"
)

& (Join-Path $PSScriptRoot "devctl.ps1") -Action start -ProjectRoot $ProjectRoot
