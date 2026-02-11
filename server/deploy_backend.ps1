# specific to SkillShare
Write-Host "Setting Google Cloud Project to skillshare-65f6c..."
gcloud config set project skillshare-65f6c

Write-Host "Deploying Backend to Cloud Run..."
Write-Host "NOTE: If asked to enable APIs (Cloud Run, Artifact Registry), type 'y'."
gcloud run deploy skillshare-backend --source . --region us-central1 --allow-unauthenticated --session-affinity

Write-Host "---------------------------------------------------"
Write-Host "DEPLOYMENT FINISHED!"
Write-Host "Please COPY the 'Service URL' shown above."
Write-Host "You will need it for the Frontend deployment."
Write-Host "---------------------------------------------------"
