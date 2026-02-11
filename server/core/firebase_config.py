import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase Admin SDK
# Check if using environment variables or service account file
if os.path.exists("serviceAccountKey.json"):
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
else:
    # Check for environment variable (Production)
    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS")
    if firebase_creds_json:
        import json
        try:
            creds_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"Failed to initialize Firebase from env var: {e}")
    else:
        # Fallback to default credentials (Google Cloud environment)
        try:
            firebase_admin.initialize_app()
        except ValueError:
            # App might already be initialized
            pass

db = firestore.client()
