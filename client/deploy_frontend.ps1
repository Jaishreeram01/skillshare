# Frontend Deployment Script
param([string]$BackendUrl)

if (-not $BackendUrl) {
    $BackendUrl = Read-Host "Enter the Backend Cloud Run URL (e.g. https://skillshare-backend-xyz.run.app)"
}

# Remove trailing slash if present
if ($BackendUrl.EndsWith("/")) {
    $BackendUrl = $BackendUrl.Substring(0, $BackendUrl.Length - 1)
}

Write-Host "Setting VITE_API_URL to $BackendUrl..."
$env:VITE_API_URL = $BackendUrl

Write-Host "Building React App..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

Write-Host "Deploying to Firebase Hosting..."
firebase deploy --only hosting

Write-Host "---------------------------------------------------"
Write-Host "FRONTEND DEPLOYED!"
Write-Host "Open the Hosting URL shown above."
Write-Host "---------------------------------------------------"
