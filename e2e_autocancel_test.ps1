$ErrorActionPreference = 'Stop'

$root = 'c:\Users\Admin\Downloads\Project_SORMS-Done-FIX\Project_SORMS-Done-FIX'
$appDevPath = Join-Path $root 'SORMS.API\appsettings.Development.json'
$config = Get-Content $appDevPath -Raw | ConvertFrom-Json
$connStr = $config.ConnectionStrings.DefaultConnection
if (-not $connStr) { throw 'Missing Development connection string' }

$login = @{ email = 'admin@sorms.com'; password = 'Admin@123456' } | ConvertTo-Json
$admin = Invoke-RestMethod -Method Post -Uri 'http://localhost:5183/api/Auth/login' -ContentType 'application/json' -Body $login
$adminToken = $admin.token
if (-not $adminToken) { $adminToken = $admin.Token }
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

$allRooms = Invoke-RestMethod -Method Get -Uri 'http://localhost:5183/api/Room' -Headers $adminHeaders
$roomObj = @($allRooms)[0]
if (-not $roomObj) { throw 'No room found' }
$roomObj.status = 'Available'
Invoke-WebRequest -Method Put -Uri ("http://localhost:5183/api/Room/" + $roomObj.id) -Headers $adminHeaders -ContentType 'application/json' -Body ($roomObj | ConvertTo-Json -Depth 8) -UseBasicParsing | Out-Null
$testRoomId = $roomObj.id

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "e2e-autocancel-$ts@sorms.test"
$user = "e2eautocancel$ts"
$pass = 'P@ssw0rd123!'
$regPayload = @{
    email = $email
    userName = $user
    password = $pass
    roleId = 3
    fullName = 'E2E AutoCancel'
    phone = '0933000011'
    identityNumber = '0733000011'
    gender = 'Male'
    dateOfBirth = '2000-01-01'
    address = 'HN'
    emergencyContact = '0933999911'
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

$checkIn = (Get-Date).ToUniversalTime().Date.AddDays(3).ToString('o')
$checkOut = (Get-Date).ToUniversalTime().Date.AddDays(4).ToString('o')
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
if (-not $invoiceId) { throw 'No invoice created for autocancel test' }

$npgsqlDll = Join-Path $root 'SORMS.API\bin\Release\net9.0\Npgsql.dll'
if (-not (Test-Path $npgsqlDll)) { throw "Npgsql dll not found: $npgsqlDll" }
Add-Type -Path $npgsqlDll
$conn = [Npgsql.NpgsqlConnection]::new($connStr)
$conn.Open()
try {
    $cmd1 = $conn.CreateCommand()
    $cmd1.CommandText = 'UPDATE "Rooms" SET "HoldExpiresAt" = NOW() - INTERVAL ''2 minutes'' WHERE "Id" = @roomId'
    [void]$cmd1.Parameters.AddWithValue('roomId', [int]$testRoomId)
    [void]$cmd1.ExecuteNonQuery()
}
finally {
    $conn.Close()
    $conn.Dispose()
}

Start-Sleep -Seconds 75

$availableAfter = Invoke-RestMethod -Method Get -Uri 'http://localhost:5183/api/Room/available' -Headers $rHeaders
$isRoomAvailable = @($availableAfter | Where-Object { $_.id -eq $testRoomId }).Count -gt 0
$paymentStatus = Invoke-RestMethod -Method Get -Uri ("http://localhost:5183/api/Payment/payment-status/" + $invoiceId) -Headers $rHeaders
$statusValue = if ($paymentStatus.data) { $paymentStatus.data.status } else { $paymentStatus.status }

Write-Output "AUTOCANCEL_ROOM_ID=$testRoomId"
Write-Output "AUTOCANCEL_INVOICE_ID=$invoiceId"
Write-Output "AUTOCANCEL_ROOM_AVAILABLE_AFTER_WORKER=$isRoomAvailable"
Write-Output "AUTOCANCEL_INVOICE_STATUS=$statusValue"
