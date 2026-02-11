# SkillShare - Learning & Teaching Platform

A full-stack platform for mentors and learners to connect via video sessions.

## 🚀 One-Click Deployment

| Service | Action |
|---------|--------|
| **Backend** | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Jaishreeram01/skillshare) |
| **Frontend** | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jaishreeram01/skillshare&env=VITE_API_URL) |

## 🛠 Manual Setup

### Backend (Render)
1.  **Environment Variables:**
    *   `PYTHON_VERSION`: `3.11.9`
    *   `SENDGRID_API_KEY`: (Your Key)
    *   `FROM_EMAIL`: `skillsharetest0107@gmail.com`
    *   `FIREBASE_CREDENTIALS`: (Content of `server/serviceAccountKey.json`)

### Frontend (Vercel)
1.  **Environment Variables:**
    *   `VITE_API_URL`: (Your Render Backend URL)
