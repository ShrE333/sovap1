# Supabase Migration Instructions

To migrate SOVAP to a live Supabase database, follow these steps:

## 1. Create a Project
1. Go to [Supabase.com](https://supabase.com/) and create a new project.
2. Note your **Project URL** and **API Keys** (Anon Public and Service Role).

## 2. Setup Database Schema
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Copy the contents of `supabase/schema.sql` (found in your project root).
3. Paste into the SQL Editor and click **Run**.
   - This creates all necessary tables (users, colleges, courses, enrollments) and security policies.

## 3. Configure Environment Variables
Create a file named `.env.local` in the root of your project (`d:\SAVAP`) and add the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
USE_SUPABASE=true
```

## 4. Deploy Updates (Done by AI)
Once you have set the variables, the application is configured to automatically switch from `mock-db` to Supabase.
- The default Admin user (`admin@sovap.in`) does NOT exist in the empty Supabase DB.
- **Action Required**: You must insert the initial admin user into Supabase manually via SQL or Table Editor:

```sql
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@sovap.in', '$2a$10$rOvHjKqNhZ5vF8qF5qF5qOqF5qF5qF5qF5qF5qF5qF5qF5qF5qF5q', 'System Administrator', 'admin');
```
(Note: The password hash above corresponds to `admin123` in our mock logic. In a real production scenario, use a proper bcrypt hash).

## 5. Restart Server
Run `npm run dev` again to load the new environment variables.
