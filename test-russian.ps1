$email = $env:ATLASSIAN_EMAIL
$token = $env:ATLASSIAN_TOKEN

if (-not $email -or -not $token) {
    throw "Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script."
}

$pair = "$email`:$token"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [System.Convert]::ToBase64String($bytes)
$headers = @{
    "Authorization" = "Basic $base64"
    "Content-Type" = "application/json"
}

$pageId = "589365250"
$getUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId`?expand=body.storage,version"

try {
    Write-Host "Getting page..."
    $response = Invoke-WebRequest -Uri $getUrl -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    $newVersion = $data.version.number + 1
    $newTitle = "Русский тест"
    
    # Create content in Russian to test Cyrillic support
    $newContent = @"
<h1>Русский текст - Тест</h1>
<p>Это тестовое содержимое на русском языке.</p>
<h2>Проверка кодировки</h2>
<p>Если этот текст отображается корректно, то я могу писать на русском языке в Confluence.</p>
<ul>
  <li>Пункт 1: Русский текст</li>
  <li>Пункт 2: Проверка UTF-8</li>
  <li>Пункт 3: Сохранение контента</li>
</ul>
"@
    
    Write-Host "Current title: $($data.title)"
    Write-Host "New title: $newTitle"
    Write-Host "New version: $newVersion"
    
    # Build update object
    $updateObj = @{
        version = @{
            number = $newVersion
        }
        title = $newTitle
        type = "page"
        body = @{
            storage = @{
                value = $newContent
                representation = "storage"
            }
        }
    }
    
    $jsonBody = $updateObj | ConvertTo-Json -Depth 20
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    
    Write-Host "Updating with Russian content..."
    $putUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId"
    $putResponse = Invoke-WebRequest -Uri $putUrl -Method PUT -Headers $headers -Body $bodyBytes -UseBasicParsing
    
    Write-Host "✅ Updated!"
    Write-Host "Checking result..."
    
    Start-Sleep -Milliseconds 500
    
    # Check immediately after
    $checkResponse = Invoke-WebRequest -Uri $getUrl -Headers $headers -UseBasicParsing
    $checkData = $checkResponse.Content | ConvertFrom-Json
    
    Write-Host "Title: $($checkData.title)"
    Write-Host "Content (first 300 chars):"
    Write-Host $checkData.body.storage.value.Substring(0, [Math]::Min(300, $checkData.body.storage.value.Length))
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
