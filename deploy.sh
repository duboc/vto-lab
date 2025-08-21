#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Get the PROJECT_ID from the .env file
export $(grep -v '^#' .env | xargs)

# Deploy to Google Cloud Run
gcloud run deploy vto-bain-lab \
  --source . \
  --region us-central1 \
  --set-env-vars="PROJECT_ID=${PROJECT_ID}" \
  --allow-unauthenticated
