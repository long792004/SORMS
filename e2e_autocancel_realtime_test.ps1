$ErrorActionPreference = 'Stop'

function Login-Admin {
    $body = @{ email = 'admin@sorms.com'; password = 'Admin@123456' } | ConvertTo-Json
    $resp = Invoke-RestMethod -Method Post -Uri 'http://localhost:5183/api/Auth/login' -ContentType 'application/json' -Body $body
    $token = $resp.token
    if (-not $token) { $token = $resp.Token }
    return $token
}

$adminToken = Login-Admin
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

$allRooms = Invoke-RestMethod -Method Get -Uri 'http://localhost:5183/api/Room' -Headers $adminHeaders
$roomObj = @($allRooms)[0]
if (-not $roomObj) { throw 'No room found for realtime auto-cancel test' }
$roomObj.status = 'Available'
Invoke-WebRequest -Method Put -Uri ("http://localhost:5183/api/Room/" + $roomObj.id) -Headers $adminHeaders -ContentType 'application/json' -Body ($roomObj | ConvertTo-Json -Depth 8) -UseBasicParsing | Out-Null
$testRoomId = $roomObj.id

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "e2e-realtime-autocancel-$ts@sorms.test"
$user = "e2erealtime$ts"
$pass = 'P@ssw0rd123!'
$regPayload = @{
    email = $email
    userName = $user
    password = $pass
    roleId = 3
    fullName = 'E2E Realtime AutoCancel'
    phone = '0944000011'
    identityNumber = '0744000011'
    gender = 'Male'
    dateOfBirth = '2000-01-01'
    address = 'HN'
    emergencyContact = '0944999911'
} | ConvertTo-Json

$reg = Invoke-RestMethod -Method Post -Uri 'http://localhost:5183/api/Auth/register' -ContentType 'application/json' -Body $regPayload
$rToken = $reg.token
if (-not $rToken) { $rToken = $reg.Token }
if (-not $rToken) {
    $lg = Invoke-RestMethod -Method Post -Uri 'http://localhost:5183/api/Auth/login' -ContentType 'application/json' -Body (@{ email = $email; password = $pass } | ConvertTo-Json)
    $rToken = $lg.token
    if (-not $rToken) { $rToken = $lg.Token }
}
$rHeaders = @{ Authorization = "Bearer $rToken" }

$checkIn = (Get-Date).ToUniversalTime().Date.AddDays(5).ToString('o')
$checkOut = (Get-Date).ToUniversalTime().Date.AddDays(6).ToString('o')
$createPayload = @{
    expectedCheckInDate = $checkIn
    expectedCheckOutDate = $checkOut
    numberOfResidents = 1
    returnUrl = 'http://localhost:5173/resident/invoices?success=true'
    cancelUrl = 'http://localhost:5173/resident/invoices?cancel=true'
} | ConvertTo-Json

$createResp = Invoke-RestMethod -Method Post -Uri "http://localhost:5183/api/Payment/create-payment-link/room/$testRoomId" -Headers $rHeaders -ContentType 'application/json' -Body $createPayload
$invoiceId = $createResp.invoiceId
if (-not $invoiceId) { $invoiceId = $createResp.InvoiceId }
if (-not $invoiceId) { throw 'No invoice created' }

Write-Output "AUTOCANCEL_REALTIME_ROOM_ID=$testRoomId"
Write-Output "AUTOCANCEL_REALTIME_INVOICE_ID=$invoiceId"
Write-Output "AUTOCANCEL_REALTIME_WAITING_MINUTES=16"

$finalStatus = ''
for ($i = 1; $i -le 16; $i++) {
    Start-Sleep -Seconds 60
    $paymentStatus = Invoke-RestMethod -Method Get -Uri ("http://localhost:5183/api/Payment/payment-status/" + $invoiceId) -Headers $rHeaders
    $statusValue = if ($paymentStatus.data) { $paymentStatus.data.status } else { $paymentStatus.status }
    Write-Output "AUTOCANCEL_REALTIME_MINUTE_$i=$statusValue"
    $finalStatus = $statusValue
    if ($statusValue -eq 'Cancelled') { break }
}

$availableAfter = Invoke-RestMethod -Method Get -Uri 'http://localhost:5183/api/Room/available' -Headers $rHeaders
$isRoomAvailable = @($availableAfter | Where-Object { $_.id -eq $testRoomId }).Count -gt 0

Write-Output "AUTOCANCEL_REALTIME_FINAL_STATUS=$finalStatus"
Write-Output "AUTOCANCEL_REALTIME_ROOM_AVAILABLE_AFTER_WORKER=$isRoomAvailable"
