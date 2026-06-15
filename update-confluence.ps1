$email = $env:ATLASSIAN_EMAIL
$token = $env:ATLASSIAN_TOKEN

if (-not $email -or -not $token) {
    throw "Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script."
}
$auth = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("$email`:$token"))
$headers = @{
    "Authorization" = "Basic $auth"
    "Content-Type" = "application/json; charset=utf-8"
}

$pageId = "589365250"
$newTitle = "Documentation!"

try {
    $getUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId`?expand=version,body.storage"
    Write-Host "Getting page info..."
    $response = Invoke-WebRequest -Uri $getUrl -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Current title: $($data.title)"
    Write-Host "Version: $($data.version.number)"
    
    $newVersion = $data.version.number + 1
    
    # Build the update object properly
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
    
    # Ensure UTF-8 encoding
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    
    $putUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId"
    Write-Host "Updating title to: $newTitle"
    $putResponse = Invoke-WebRequest -Uri $putUrl -Method PUT -Headers $headers -Body $bodyBytes -UseBasicParsing -ContentType "application/json; charset=utf-8"
    
    Write-Host "Success! New title: $newTitle"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Server response: $responseBody"
        } catch {}
    }
}
