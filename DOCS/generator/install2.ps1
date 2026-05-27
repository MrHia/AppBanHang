Set-Location "e:\Workspace\JavaJob\AppBanHang\DOCS\generator"
Write-Host "NPM prefix: $(npm config get prefix)"
Write-Host "NPM registry: $(npm config get registry)"
Write-Host "Current directory: $(Get-Location)"

# Try installing lodash as a test
npm install lodash --save
if (Test-Path "node_modules\lodash") {
    Write-Host "lodash installed OK"
} else {
    Write-Host "lodash FAILED"
}

# Try installing docx
npm install docx --save --verbose 2>&1 | Tee-Object -FilePath "npm_verbose.log"
