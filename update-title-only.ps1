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
    $newTitle = "TMS Documentation (Updated)"
    
    Write-Host "Current title: $($data.title)"
    Write-Host "New title: $newTitle"
    Write-Host "New version: $newVersion"
    
    # Keep content as-is, only update title
    $updateObj = @{
        version = @{
            number = $newVersion
        }
        title = $newTitle
        type = "page"
        body = @{
            storage = @{
                value = $data.body.storage.value
                representation = "storage"
            }
        }
    }
    
    $jsonBody = $updateObj | ConvertTo-Json -Depth 20
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    
    $putUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId"
    Write-Host "Updating title..."
    $putResponse = Invoke-WebRequest -Uri $putUrl -Method PUT -Headers $headers -Body $bodyBytes -UseBasicParsing
    
    Write-Host "✅ Title updated successfully!"
    Write-Host "New title: $newTitle"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $error_body = $reader.ReadToEnd()
            Write-Host "Response: $error_body"
        } catch {}
    }
}
