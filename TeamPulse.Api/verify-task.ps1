$body = @{ Username = 'admin'; Password = 'password' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
Write-Output "TOKEN=$($login.token)"
$tasks = Invoke-RestMethod -Uri 'http://localhost:5000/api/task' -Headers @{ Authorization = 'Bearer ' + $login.token }
Write-Output ($tasks | ConvertTo-Json -Depth 5)
