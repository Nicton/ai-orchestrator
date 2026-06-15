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
}

$pageId = "589365250"
$getUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId`?expand=body.storage,version"

try {
    Write-Host "Getting current page content..."
    $response = Invoke-WebRequest -Uri $getUrl -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Title: $($data.title)"
    Write-Host "Version: $($data.version.number)"
    Write-Host ""
    
    # Show first 1000 chars
    $content = $data.body.storage.value
    Write-Host "Content (first 1000 chars):"
    Write-Host $content.Substring(0, [Math]::Min(1000, $content.Length))
    Write-Host ""
    Write-Host "Total content length: $($content.Length) chars"
    
    # Save full content
    $content | Out-File "confluence-current.html" -Encoding UTF8
    Write-Host "Saved to confluence-current.html"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
