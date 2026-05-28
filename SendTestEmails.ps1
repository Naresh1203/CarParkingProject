$ErrorActionPreference = "Stop"
$apiUrl = "http://localhost:8000/api"
$email = "naresh9799612951@gmail.com"
$pwd = "SmartParking@1103"

Write-Host "1) Logging in to trigger Login Alert..."
try {
    $loginBody = @{ email=$email; password=$pwd } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$apiUrl/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.token
    $userId = $loginRes.user.id
    Write-Host "Logged in successfully. Token obtained."
} catch {
    Write-Host "Login failed! Creating user first..."
    $regBody = @{ name="Naresh"; email=$email; phoneNumber="9799612951"; password=$pwd; role="User" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$apiUrl/Auth/register" -Method Post -Body $regBody -ContentType "application/json"
    $loginRes = Invoke-RestMethod -Uri "$apiUrl/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.token
    $userId = $loginRes.user.id
}

Write-Host "3) Creating a Host & Parking Spot..."
$hostEmail = "host$(Get-Random)@host.com"
$hostBody = @{ name="TempHost"; email=$hostEmail; phoneNumber="000"; password=$pwd; role="Host" } | ConvertTo-Json
Invoke-RestMethod -Uri "$apiUrl/Auth/register" -Method Post -Body $hostBody -ContentType "application/json"
$hLogin = Invoke-RestMethod -Uri "$apiUrl/Auth/login" -Method Post -Body (@{email=$hostEmail; password=$pwd} | ConvertTo-Json) -ContentType "application/json"
$hToken = $hLogin.token
$hId = $hLogin.user.id

$spotBody = @{ name="Demo Spot"; address="123 Test Ave"; latitude=10; longitude=10; pricePerHour=50; isAvailable=$true; totalCapacity=10; hostId=$hId } | ConvertTo-Json
$newSpot = Invoke-RestMethod -Uri "$apiUrl/ParkingSpots" -Method Post -Headers @{ Authorization="Bearer $hToken" } -Body $spotBody -ContentType "application/json"
$spotId = $newSpot.id
Write-Host "Created spot ID: $spotId"


Write-Host "4) Creating a Booking to trigger Slot Book Confirmation..."
$startTime = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$endTime = (Get-Date).AddHours(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
$bookBody = @{ userId=$userId; parkingSpotId=$spotId; startTime=$startTime; endTime=$endTime; totalPrice=100 } | ConvertTo-Json
$booking = Invoke-RestMethod -Uri "$apiUrl/Booking" -Method Post -Headers @{ Authorization="Bearer $token" } -Body $bookBody -ContentType "application/json"
$bookingId = $booking.id
Write-Host "Booking created! ID: $bookingId"

Write-Host "5) Canceling Booking to trigger Slot Cancel Confirmation..."
Invoke-RestMethod -Uri "$apiUrl/Booking/$bookingId" -Method Delete -Headers @{ Authorization="Bearer $token" }
Write-Host "Booking canceled."

Write-Host "6) Triggering Forgot Password Confirmation..."
$fpBody = @{ email=$email } | ConvertTo-Json
Invoke-RestMethod -Uri "$apiUrl/Auth/forgot-password" -Method Post -Body $fpBody -ContentType "application/json"
Write-Host "Forgot password triggered."

Write-Host "ALL 5 EMAILS DISPATCHED AUTOMATICALLY!"
