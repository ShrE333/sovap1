# Deployment Guide for sovap.in

## 1. Prerequisites
- A GitHub/GitLab repository with this code.
- A Vercel account (recommended for Next.js).
- Access to your domain registrar for `sovap.in`.
- Your Supabase Project setup (see `SETUP_SUPABASE.md`).

## 2. Deploy to Vercel
1.  **Push Code**: Push your local code (`d:\SAVAP`) to a GitHub repository.
2.  **Import Project**: Go to Vercel Dashboard -> "Add New..." -> Project -> Select your GitHub repo.
3.  **Configure Environment Variables**:
    In the deployment settings, add the following variables (Use values from your `.env.local`):
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY` (If using server-side features)
    - `USE_SUPABASE=true`
4.  **Deploy**: Click "Deploy". Vercel will build and start your application.

## 3. Configure Domain (sovap.in)
1.  In your Vercel Project Dashboard, go to **Settings > Domains**.
2.  Enter `sovap.in` and click Add.
3.  **Update DNS**: Vercel will provide A Records or CNAME records.
    - Go to your Domain Registrar (where you bought `sovap.in`).
    - Update DNS records to match Vercel's instructions (usually A Record `@` -> `76.76.21.21`).
4.  Wait for SSL generation (automatic).

## 4. Verify Backend Logic (SOVAP-Core)
- Access `https://sovap.in/teacher/ai`.
- Login as a Teacher/Admin.
- Test the "AI Curriculum Engine" to ensure it generates JSON structure correctly.
- This confirms the API routes are functioning in production.

## Troubleshooting
- **Build Failures**: Run `npm run build` locally to catch TypeErrors before pushing.
- **Database Connection**: Ensure `USE_SUPABASE=true` is set in Vercel Environment Variables.
