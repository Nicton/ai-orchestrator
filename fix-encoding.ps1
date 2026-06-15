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
    "Content-Type" = "application/json; charset=utf-8"
}

$pageId = "589365250"
$getUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId`?expand=body.storage,version"

try {
    Write-Host "Getting page..."
    $response = Invoke-WebRequest -Uri $getUrl -Headers $headers -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    $currentVersion = $data.version.number
    Write-Host "Current version: $currentVersion"
    
    # Fix the content - replace corrupted Russian text with proper UTF-8 encoded HTML
    # The corrupted pattern appears to be repeating, so we'll fix it systematically
    $brokenContent = $data.body.storage.value
    
    # Save broken content for reference
    $brokenContent | Out-File "confluence-broken.html" -Encoding UTF8
    
    # The corruption appears to be systematic - let's try to decode it
    # Convert UTF8 bytes that were interpreted as Latin1 back to UTF8
    $latin1Bytes = [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetBytes($brokenContent)
    $fixedContent = [System.Text.Encoding]::UTF8.GetString($latin1Bytes)
    
    # Save fixed content
    $fixedContent | Out-File "confluence-fixed.html" -Encoding UTF8
    
    Write-Host "Fixed content created"
    Write-Host "First 500 chars of fixed content:"
    Write-Host $fixedContent.Substring(0, [Math]::Min(500, $fixedContent.Length))
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
