---
description: Deploy SOVAP Platform to Vercel and Render
---

# 🚀 SOVAP Deployment Workflow

Follow these steps to ensure both the Frontend (Vercel) and AI Generator (Render) are perfectly synced.

## 1. Deploy Python Generator (Render)
1. Ensure `generator-lab/app.py` and `generator-lab/Dockerfile` are pushed to GitHub.
2. In **Render Dashboard**:
   - Create a new **Web Service**.
   - Select your repository and the `generator-lab` root directory.
   - **Environment Variables**: Add `GROQ_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`, `GITHUB_TOKEN`, `GITHUB_REPO`.
   - **Start Command**: Should be detected from Dockerfile, or use `uvicorn app:app --host 0.0.0.0 --port 10000`.
3. Wait for the status to turn **Live**. Copy the URL.

## 2. Deploy Frontend (Vercel)
1. In **Vercel Dashboard**:
   - Go to **Settings > Environment Variables**.
   - Add/Update `GENERATOR_LAB_URL` with your Render URL.
   - Set `USE_MOCK_DATA` to `false`.
   - Ensure Supabase keys are correct.
2. Trigger a new deployment (or push to main).

## 3. Verify System Health
1. Visit `[Your Render URL]/health` - Everything should show `true` or `UP`.
2. Visit `[Your Vercel URL]/api/student/dashboard` (while logged in) to verify DB connectivity.

## 4. Generate Flagship Courses
1. Login as **Teacher**.
2. Go to **Workbench > Magic AI Create**.
3. Create "Applied Generative AI Architecture".
4. Monitor logs on Render to see the agents in action.
