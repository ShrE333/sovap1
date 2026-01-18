# Render Deployment Guide for SOVAP Generator Lab

This service handles the heavy AI course generation (Phase 1-5). It is containerized using Docker and should be deployed on Render as a **Web Service**.

## 1. Create a New Web Service on Render
1.  Go to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** > **Web Service**.
3.  Connect the GitHub repository: `https://github.com/ShrE333/sovap1.git`.
4.  **Root Directory**: Set this to `generator-lab`.
5.  **Environment**: Select **Docker**.

## 2. Configure Runtime Settings
-   **Plan**: Choose a plan with at least **2GB RAM** (Generation tasks are CPU/RAM intensive).
-   **Health Check Path**: `/` (FastAPI default).
-   **Docker Command**: Leave default (it will use the `CMD` in our Dockerfile).

## 3. Mandatory Environment Variables
Add these in the Render "Environment" tab:
- `PORT`: `8000`
- `GROQ_API_KEY`: `your_key_here`
- `GITHUB_TOKEN`: `your_key_here`
- `GITHUB_REPO`: `Shrees-Projects/sovap-course-storage`
- `QDRANT_URL`: `your_qdrant_cloud_url`
- `QDRANT_API_KEY`: `your_qdrant_key`
- `NEO4J_URI`: `your_neo4j_aura_url`
- `NEO4J_USER`: `neo4j`
- `NEO4J_PASSWORD`: `your_password`

## 4. Update Vercel (sovap.in)
Once Render gives you a URL (e.g., `https://sovap-lab.onrender.com`), go to your **Vercel Dashboard** for `sovap.in` and update:
- `GENERATOR_LAB_URL` = `https://sovap-lab.onrender.com`

## 5. Deployment Note (Free Tier)
If using Render's Free Tier, the service will "spin down" after inactivity. The first request from the Teacher Dashboard might take 30-60 seconds to wake it up. For production, the **Starter** plan is recommended.
