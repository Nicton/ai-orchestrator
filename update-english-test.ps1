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
    $newTitle = "Documentation (English Test)"
    
    # Create simple English content to test encoding
    $newContent = @"
<h1>ShiptiFy TMS - Documentation</h1>
<p>This is a test update with English content only.</p>
<h2>Test Content</h2>
<p>If this text appears correctly, the encoding issue is with Cyrillic/non-ASCII characters.</p>
<ul>
  <li>Point 1: Basic testing</li>
  <li>Point 2: UTF-8 encoding verification</li>
  <li>Point 3: Content preservation</li>
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
    
    Write-Host "JSON body length: $($jsonBody.Length) chars"
    Write-Host "Body bytes length: $($bodyBytes.Length) bytes"
    
    $putUrl = "https://shiptify.atlassian.net/wiki/rest/api/content/$pageId"
    Write-Host "Updating with English content..."
    $putResponse = Invoke-WebRequest -Uri $putUrl -Method PUT -Headers $headers -Body $bodyBytes -UseBasicParsing
    
    Write-Host "✅ Updated successfully!"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
