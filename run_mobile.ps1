# Auto-detects the current Wi-Fi IP and runs the Flutter mobile app with it.
# Usage: .\run_mobile.ps1
# Optional args are forwarded to flutter run, e.g.: .\run_mobile.ps1 --release

$wifi = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -match 'Wi-?Fi' -and $_.IPAddress -notlike '169.*' } |
    Select-Object -First 1

if (-not $wifi) {
    Write-Host "WARNING: Wi-Fi adapter not found. Using IP from api_constants.dart." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\apps\mobile"
    flutter run @args
    exit
}

$ip     = $wifi.IPAddress
$apiUrl = "http://$ip`:3000/api/v1"

Write-Host ""
Write-Host "  Wi-Fi IP  : $ip"     -ForegroundColor Green
Write-Host "  API URL   : $apiUrl" -ForegroundColor Cyan
Write-Host ""

Set-Location "$PSScriptRoot\apps\mobile"
flutter run "--dart-define=API_BASE_URL=$apiUrl" @args
