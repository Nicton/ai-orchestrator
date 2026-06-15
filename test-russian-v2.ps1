$email = $env:ATLASSIAN_EMAIL
$token = $env:ATLASSIAN_TOKEN

if (-not $email -or -not $token) {
    throw "Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script."
}

$pair = "$email`:$token"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [System.Convert]::ToBase64String($bytes)

$pageId = "589365250"
$getUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId`?expand=body.storage,version"

try {
    Write-Host "Getting page..."
    
    # Create request with explicit UTF-8 encoding
    $request = [System.Net.WebRequest]::Create($getUrl)
    $request.Method = "GET"
    $request.ContentType = "application/json; charset=utf-8"
    $request.Headers.Add("Authorization", "Basic $base64")
    
    $response = $request.GetResponse()
    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
    $responseBody = $reader.ReadToEnd()
    $reader.Close()
    $response.Close()
    
    $data = $responseBody | ConvertFrom-Json
    
    $newVersion = $data.version.number + 1
    $newTitle = "Русский тест 2"
    
    $newContent = @"
<h1>Русский текст - Тест 2</h1>
<p>Это тестовое содержимое на русском языке.</p>
<h2>Проверка кодировки UTF-8</h2>
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
    
    # Create PUT request with explicit UTF-8
    $putUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId"
    $putRequest = [System.Net.WebRequest]::Create($putUrl)
    $putRequest.Method = "PUT"
    $putRequest.ContentType = "application/json; charset=utf-8"
    $putRequest.Headers.Add("Authorization", "Basic $base64")
    
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    $putRequest.ContentLength = $bodyBytes.Length
    
    $stream = $putRequest.GetRequestStream()
    $stream.Write($bodyBytes, 0, $bodyBytes.Length)
    $stream.Close()
    
    Write-Host "Sending update..."
    $putResponse = $putRequest.GetResponse()
    Write-Host "Response status: $($putResponse.StatusCode)"
    $putResponse.Close()
    
    Write-Host "✅ Updated!"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Stack: $($_.Exception.StackTrace)"
}
