$ErrorActionPreference = 'Stop'

$adminLogin = @{ email = 'admin@sorms.com'; password = 'Admin@123456' } | ConvertTo-Json
$adminResp = Invoke-RestMethod -Method Post -Uri 'http://localhost:5183/api/Auth/login' -ContentType 'application/json' -Body $adminLogin
$adminToken = $adminResp.token
if (-not $adminToken) { $adminToken = $adminResp.Token }
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
function New-Resident($idx) {
    $email = "e2e-hold-$idx-$ts@sorms.test"
    $user = "e2ehold$idx$ts"
    $pass = 'P@ssw0rd123!'
    $payload = @{
        email = $email
        userName = $user
        password = $pass
        roleId = 3
        fullName = "E2E Hold $idx"
        phone = "0911000$idx"
        identityNumber = "0711222$idx"
        gender = 'Male'
        dateOfBirth = '2000-01-01'
        address = 'HN'
        emergencyContact = "0909888$idx"
    } | ConvertTo-Json

    $reg = Invoke-RestMethod -Method Post -Uri 'http://localhost:5183/api/Auth/register' -ContentType 'application/json' -Body $payload
    $token = $reg.token
    if (-not $token) { $token = $reg.Token }

    if (-not $token) {
        $l = Invoke-RestMethod -Method Post -Uri 'http://localhost:5183/api/Auth/login' -ContentType 'application/json' -Body (@{ email = $email; password = $pass } | ConvertTo-Json)
        $token = $l.token
        if (-not $token) { $token = $l.Token }
    }

    [PSCustomObject]@{ Email = $email; Token = $token }
}

$r1 = New-Resident 1
$r2 = New-Resident 2
$r1Headers = @{ Authorization = "Bearer $($r1.Token)" }
$r2Headers = @{ Authorization = "Bearer $($r2.Token)" }

$available = Invoke-RestMethod -Method Get -Uri 'http://localhost:5183/api/Room/available' -Headers $r1Headers
$availableRooms = @($available)
$roomId = ($availableRooms | Select-Object -First 1).id
if (-not $roomId) { throw 'No available room for test' }

$checkIn = (Get-Date).ToUniversalTime().Date.AddDays(1).ToString('o')
$checkOut = (Get-Date).ToUniversalTime().Date.AddDays(2).ToString('o')
$createPayload = @{
    expectedCheckInDate = $checkIn
    expectedCheckOutDate = $checkOut
    numberOfResidents = 1
    returnUrl = 'http://localhost:5173/resident/invoices?success=true'
    cancelUrl = 'http://localhost:5173/resident/invoices?cancel=true'
} | ConvertTo-Json

$r1Create = Invoke-RestMethod -Method Post -Uri "http://localhost:5183/api/Payment/create-payment-link/room/$roomId" -Headers $r1Headers -ContentType 'application/json' -Body $createPayload
$invoiceId = $r1Create.invoiceId
if (-not $invoiceId) { $invoiceId = $r1Create.InvoiceId }
$orderCode = $r1Create.orderCode
if (-not $orderCode) { $orderCode = $r1Create.OrderCode }
if (-not $invoiceId -or -not $orderCode) { throw 'Missing invoice/order from create payment link' }

$availableAfterHold = Invoke-RestMethod -Method Get -Uri 'http://localhost:5183/api/Room/available' -Headers $r2Headers
$roomStillVisible = @($availableAfterHold | Where-Object { $_.id -eq $roomId }).Count -gt 0

$r2Blocked = $false
$r2BlockMessage = ''
try {
    Invoke-RestMethod -Method Post -Uri "http://localhost:5183/api/Payment/create-payment-link/room/$roomId" -Headers $r2Headers -ContentType 'application/json' -Body $createPayload | Out-Null
}
catch {
    $r2Blocked = $true
    $resp = $_.Exception.Response
    if ($resp) {
        $sr = New-Object IO.StreamReader($resp.GetResponseStream())
        $r2BlockMessage = $sr.ReadToEnd()
    }
    else {
        $r2BlockMessage = $_.Exception.Message
    }
}

$checksum = '0d9fce11f9c233064701395bfe910bbce1558f2ccdfc41e5ce819ea79b0ed389'
$data = [ordered]@{
    accountNumber = ''
    amount = 1000
    code = '00'
    counterAccountBankId = ''
    counterAccountBankName = ''
    counterAccountName = ''
    counterAccountNumber = ''
    currency = 'VND'
    desc = ''
    description = 'PAID'
    orderCode = [int64]$orderCode
    paymentLinkId = ''
    reference = ''
    transactionDateTime = (Get-Date).ToUniversalTime().ToString('o')
    virtualAccountName = ''
    virtualAccountNumber = ''
}

$keys = $data.Keys | Sort-Object
$pairs = foreach ($k in $keys) { "$k=$($data[$k])" }
$query = [string]::Join('&', $pairs)
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($checksum)
$hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($query))
$signature = -join ($hash | ForEach-Object { $_.ToString('x2') })

$webhook = @{
    code = '00'
    desc = 'success'
    success = $true
    data = $data
    signature = $signature
} | ConvertTo-Json -Depth 8

$webhookResp = Invoke-RestMethod -Method Post -Uri 'http://localhost:5183/api/Payment/payos-webhook' -ContentType 'application/json' -Body $webhook

Start-Sleep -Seconds 2
$payStatus = Invoke-RestMethod -Method Get -Uri "http://localhost:5183/api/Payment/payment-status/$invoiceId" -Headers $r1Headers
$statusValue = if ($payStatus.data) { $payStatus.data.status } else { $payStatus.status }

$pendingCheckins = Invoke-RestMethod -Method Get -Uri 'http://localhost:5183/api/CheckIn/pending-checkin' -Headers $adminHeaders
$pendingList = if ($pendingCheckins.data) { @($pendingCheckins.data) } else { @($pendingCheckins) }
$hasPending = @($pendingList | Where-Object { $_.roomId -eq $roomId }).Count -gt 0

Write-Output "TEST_ROOM_ID=$roomId"
Write-Output "STEP1_CREATE_LINK_SUCCESS=$($r1Create.success)"
Write-Output "STEP2_ROOM_HIDDEN_WHILE_HOLD=$([bool](-not $roomStillVisible))"
Write-Output "STEP3_SECOND_RESIDENT_BLOCKED=$r2Blocked"
Write-Output "STEP3_BLOCK_MESSAGE=$r2BlockMessage"
Write-Output "STEP4_WEBHOOK_ACCEPTED=$($webhookResp.success)"
Write-Output "STEP5_INVOICE_STATUS_AFTER_WEBHOOK=$statusValue"
Write-Output "STEP6_PENDING_CHECKIN_CREATED=$hasPending"
