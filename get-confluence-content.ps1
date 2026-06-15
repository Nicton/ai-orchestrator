$email = $env:ATLASSIAN_EMAIL
$token = $env:ATLASSIAN_TOKEN

if (-not $email -or -not $token) {
    throw "Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script."
}

# Create Basic auth header
$pair = "$email`:$token"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [System.Convert]::ToBase64String($bytes)
$headers = @{
    "Authorization" = "Basic $base64"
    "Accept" = "application/json"
}

$pageId = "589365250"
$getUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId`?expand=body.storage,version"

try {
    Write-Host "Getting page content..."
    $response = Invoke-WebRequest -Uri $getUrl -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Title: $($data.title)"
    Write-Host "Version: $($data.version.number)"
    Write-Host ""
    Write-Host "=== RAW CONTENT (Storage format) ==="
    $storageContent = $data.body.storage.value
    Write-Host $storageContent
    
    # Save to file
    $storageContent | Out-File "C:\Users\Lenovo\Desktop\12devs\shiptify\code\ai-orchestrator\confluence-content.html" -Encoding UTF8
    Write-Host ""
    Write-Host "Saved to confluence-content.html"
    
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
