Set-Location "e:\Workspace\JavaJob\AppBanHang\DOCS\generator"
npm install docx
if (Test-Path "node_modules\docx") {
    Write-Host "SUCCESS: docx installed"
    Write-Host (Get-ChildItem "node_modules\docx" | Measure-Object).Count "files"
} else {
    Write-Host "FAILED: docx not found"
}
