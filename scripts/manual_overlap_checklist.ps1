$ErrorActionPreference = 'Stop'

$baseUrl = 'http://localhost:5183/api'
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

function Get-TokenFromResponse($resp) {
    $token = $resp.token
    if (-not $token) { $token = $resp.Token }
    return $token
}

function New-Resident($idx) {
    $email = "manual-overlap-$idx-$ts@sorms.test"
    $user = "manualoverlap$idx$ts"
    $pass = 'P@ssw0rd123!'

    $payload = @{
        email = $email
        userName = $user
        password = $pass
        roleId = 3
        fullName = "Manual Overlap $idx"
        phone = "0987000$idx"
        identityNumber = "0987666$idx"
        gender = 'Male'
        dateOfBirth = '2000-01-01'
        address = 'HN'
        emergencyContact = "0977999$idx"
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

# Case dates: 20-21 and 22-23 style, but generated in near-future to avoid past-date problems.
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
$roomCandidates = @($roomsA | Where-Object { $_.id })
if ($roomCandidates.Count -eq 0) { throw 'No available room found for Case A' }

$createBodyA = @{
    expectedCheckInDate = $caseAIn
    expectedCheckOutDate = $caseAOut
    numberOfResidents = 1
    returnUrl = 'http://localhost:5173/resident/invoices?success=true'
    cancelUrl = 'http://localhost:5173/resident/invoices?cancel=true'
} | ConvertTo-Json

$createA = $null
$roomId = $null
$caseAErrorMessages = @()

foreach ($candidate in $roomCandidates) {
    $candidateRoomId = $candidate.id
    try {
        $attempt = Invoke-RestMethod -Method Post -Uri "$baseUrl/Payment/create-payment-link/room/$candidateRoomId" -Headers $r1Headers -ContentType 'application/json' -Body $createBodyA
        $createA = $attempt
        $roomId = $candidateRoomId
        break
    }
    catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $reader = New-Object IO.StreamReader($resp.GetResponseStream())
            $caseAErrorMessages += "room=$candidateRoomId => $($reader.ReadToEnd())"
        } else {
            $caseAErrorMessages += "room=$candidateRoomId => $($_.Exception.Message)"
        }
    }
}

if (-not $roomId -or -not $createA) {
    $allErrors = [string]::Join(' | ', $caseAErrorMessages)
    throw "Unable to create Case A booking link for any available room. Errors: $allErrors"
}

$overlapBlocked = $false
$overlapMessage = ''
try {
    Invoke-RestMethod -Method Post -Uri "$baseUrl/Payment/create-payment-link/room/$roomId" -Headers $r2Headers -ContentType 'application/json' -Body $createBodyA | Out-Null
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

$createBodyB = @{
    expectedCheckInDate = $caseBIn
    expectedCheckOutDate = $caseBOut
    numberOfResidents = 1
    returnUrl = 'http://localhost:5173/resident/invoices?success=true'
    cancelUrl = 'http://localhost:5173/resident/invoices?cancel=true'
} | ConvertTo-Json

$nonOverlapSuccess = $false
$nonOverlapMessage = ''
try {
    $createB = Invoke-RestMethod -Method Post -Uri "$baseUrl/Payment/create-payment-link/room/$roomId" -Headers $r2Headers -ContentType 'application/json' -Body $createBodyB
    $nonOverlapSuccess = [bool]($createB.success -eq $true -or $createB.Success -eq $true)
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

Write-Output "CHECKLIST_ROOM_ID=$roomId"
Write-Output "CHECKLIST_CASE_A=$($day1.ToString('yyyy-MM-dd'))->$($day2.ToString('yyyy-MM-dd'))"
Write-Output "CHECKLIST_CASE_B=$($day3.ToString('yyyy-MM-dd'))->$($day4.ToString('yyyy-MM-dd'))"
Write-Output "STEP1_CASE_A_CREATE_SUCCESS=$([bool]($createA.success -eq $true -or $createA.Success -eq $true))"
Write-Output "STEP2_OVERLAP_BLOCKED=$overlapBlocked"
Write-Output "STEP2_OVERLAP_MESSAGE=$overlapMessage"
Write-Output "STEP3_ROOM_VISIBLE_FOR_NON_OVERLAP_RANGE=$roomVisibleInCaseB"
Write-Output "STEP4_NON_OVERLAP_CREATE_SUCCESS=$nonOverlapSuccess"
Write-Output "STEP4_NON_OVERLAP_MESSAGE=$nonOverlapMessage"
