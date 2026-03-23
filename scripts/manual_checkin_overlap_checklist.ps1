$ErrorActionPreference = 'Stop'

$baseUrl = 'http://localhost:5183/api'
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

function Get-TokenFromResponse($resp) {
    $token = $resp.token
    if (-not $token) { $token = $resp.Token }
    return $token
}

function New-Resident($idx) {
    $email = "manual-checkin-overlap-$idx-$ts@sorms.test"
    $user = "manualcheckinoverlap$idx$ts"
    $pass = 'P@ssw0rd123!'

    $payload = @{
        email = $email
        userName = $user
        password = $pass
        roleId = 3
        fullName = "Manual Checkin Overlap $idx"
        phone = "0937000$idx"
        identityNumber = "0937666$idx"
        gender = 'Male'
        dateOfBirth = '2000-01-01'
        address = 'HN'
        emergencyContact = "0937999$idx"
    } | ConvertTo-Json

    $regResp = Invoke-RestMethod -Method Post -Uri "$baseUrl/Auth/register" -ContentType 'application/json' -Body $payload
    $token = Get-TokenFromResponse $regResp

    if (-not $token) {
        $loginResp = Invoke-RestMethod -Method Post -Uri "$baseUrl/Auth/login" -ContentType 'application/json' -Body (@{ email = $email; password = $pass } | ConvertTo-Json)
        $token = Get-TokenFromResponse $loginResp
    }

    if (-not $token) { throw "Unable to obtain token for resident $idx" }

    return [PSCustomObject]@{
        Email = $email
        Token = $token
    }
}

$r1 = New-Resident 1
$r2 = New-Resident 2
$r1Headers = @{ Authorization = "Bearer $($r1.Token)" }
$r2Headers = @{ Authorization = "Bearer $($r2.Token)" }

$day1 = (Get-Date).ToUniversalTime().Date.AddDays(2)
$day2 = $day1.AddDays(1)
$day3 = $day1.AddDays(2)
$day4 = $day1.AddDays(3)

$caseAIn = $day1.ToString('o')
$caseAOut = $day2.ToString('o')
$caseBIn = $day3.ToString('o')
$caseBOut = $day4.ToString('o')

$availableA = Invoke-RestMethod -Method Get -Uri "$baseUrl/Room/available?checkIn=$([uri]::EscapeDataString($caseAIn))&checkOut=$([uri]::EscapeDataString($caseAOut))" -Headers $r1Headers
$roomsA = @($availableA)
$roomId = ($roomsA | Select-Object -First 1).id
if (-not $roomId) { throw 'No available room found for Case A' }

$checkinBodyA = @{
    roomId = $roomId
    checkInDate = $caseAIn
    checkOutDate = $caseAOut
    numberOfResidents = 1
} | ConvertTo-Json

$reqA = Invoke-RestMethod -Method Post -Uri "$baseUrl/CheckIn/request-checkin" -Headers $r1Headers -ContentType 'application/json' -Body $checkinBodyA
$caseASuccess = [bool]($reqA.success -eq $true -or $reqA.Success -eq $true)

$overlapBlocked = $false
$overlapMessage = ''
try {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/CheckIn/request-checkin" -Headers $r2Headers -ContentType 'application/json' -Body $checkinBodyA | Out-Null
}
catch {
    $overlapBlocked = $true
    $resp = $_.Exception.Response
    if ($resp) {
        $reader = New-Object IO.StreamReader($resp.GetResponseStream())
        $overlapMessage = $reader.ReadToEnd()
    } else {
        $overlapMessage = $_.Exception.Message
    }
}

$availableB = Invoke-RestMethod -Method Get -Uri "$baseUrl/Room/available?checkIn=$([uri]::EscapeDataString($caseBIn))&checkOut=$([uri]::EscapeDataString($caseBOut))" -Headers $r2Headers
$roomsB = @($availableB)
$roomVisibleInCaseB = @($roomsB | Where-Object { $_.id -eq $roomId }).Count -gt 0

$checkinBodyB = @{
    roomId = $roomId
    checkInDate = $caseBIn
    checkOutDate = $caseBOut
    numberOfResidents = 1
} | ConvertTo-Json

$nonOverlapSuccess = $false
$nonOverlapMessage = ''
try {
    $reqB = Invoke-RestMethod -Method Post -Uri "$baseUrl/CheckIn/request-checkin" -Headers $r2Headers -ContentType 'application/json' -Body $checkinBodyB
    $nonOverlapSuccess = [bool]($reqB.success -eq $true -or $reqB.Success -eq $true)
}
catch {
    $resp = $_.Exception.Response
    if ($resp) {
        $reader = New-Object IO.StreamReader($resp.GetResponseStream())
        $nonOverlapMessage = $reader.ReadToEnd()
    } else {
        $nonOverlapMessage = $_.Exception.Message
    }
}

$invoicesR2 = Invoke-RestMethod -Method Get -Uri "$baseUrl/Payment/my-invoices" -Headers $r2Headers
$invoiceList = if ($invoicesR2.data) { @($invoicesR2.data) } else { @($invoicesR2) }
$invoiceCaseB = $invoiceList |
    Where-Object {
        $_.roomId -eq $roomId -and
        [string]$_.description -like "*${($day3.ToString('yyyy-MM-dd'))}*" -and
        [string]$_.description -like "*${($day4.ToString('yyyy-MM-dd'))}*"
    } |
    Select-Object -First 1

$dailyAmountCheck = $false
$amountDetail = ''
if ($invoiceCaseB) {
    $expectedNights = [int]($day4 - $day3).Days
    $description = [string]$invoiceCaseB.description
    $descriptionDailyRate = 0
    if ($description -match 'x\s*([\d,]+)\/day') {
        $descriptionDailyRate = [decimal](($matches[1] -replace ',', ''))
    }

    $originalValue = $invoiceCaseB.originalAmount
    if ($null -eq $originalValue) {
        $originalValue = $invoiceCaseB.amount
    }
    $actualOriginal = [decimal]$originalValue
    if ($descriptionDailyRate -gt 0) {
        $dailyAmountCheck = ([decimal]($descriptionDailyRate * $expectedNights) -eq $actualOriginal)
        $amountDetail = "dailyRate=$descriptionDailyRate;nights=$expectedNights;expected=$([decimal]($descriptionDailyRate * $expectedNights));actual=$actualOriginal"
    } else {
        $amountDetail = "Could not parse daily rate from description: $description"
    }
}

Write-Output "CHECKLIST_ROOM_ID=$roomId"
Write-Output "CHECKLIST_CASE_A=$($day1.ToString('yyyy-MM-dd'))->$($day2.ToString('yyyy-MM-dd'))"
Write-Output "CHECKLIST_CASE_B=$($day3.ToString('yyyy-MM-dd'))->$($day4.ToString('yyyy-MM-dd'))"
Write-Output "STEP1_CASE_A_CHECKIN_SUCCESS=$caseASuccess"
Write-Output "STEP2_OVERLAP_BLOCKED=$overlapBlocked"
Write-Output "STEP2_OVERLAP_MESSAGE=$overlapMessage"
Write-Output "STEP3_ROOM_VISIBLE_FOR_NON_OVERLAP_RANGE=$roomVisibleInCaseB"
Write-Output "STEP4_NON_OVERLAP_CHECKIN_SUCCESS=$nonOverlapSuccess"
Write-Output "STEP4_NON_OVERLAP_MESSAGE=$nonOverlapMessage"
Write-Output "STEP5_DAILY_AMOUNT_MATCH=$dailyAmountCheck"
Write-Output "STEP5_DAILY_AMOUNT_DETAIL=$amountDetail"
