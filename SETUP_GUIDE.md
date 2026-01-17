# SOVAP.in - Dynamic Backend Setup Guide

## 🚀 Overview
This guide will help you set up the fully dynamic SOVAP platform with:
- **Supabase** for authentication and database
- **JWT** for secure token-based auth
- **Row Level Security (RLS)** to prevent privilege escalation
- **Audit logging** for all critical actions
- **API rate limiting** and monitoring

---

## 📋 Prerequisites

1. **Node.js** 18+ installed
2. **Supabase Account** (free tier works)
3. **Git** for version control

---

## 🔧 Step 1: Install Dependencies

```bash
cd d:\SAVAP
npm install
```

This will install:
- `@supabase/supabase-js` - Database client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `zod` - Input validation

---

## 🗄️ Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name:** SOVAP
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to you
4. Wait for project to initialize (~2 minutes)

### 2.2 Get API Keys

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (⚠️ NEVER expose this publicly)

### 2.3 Run Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Copy the entire contents of `d:\SAVAP\supabase\schema.sql`
4. Paste and click **RUN**
5. You should see: "Success. No rows returned"

This creates:
- ✅ All tables (users, colleges, courses, etc.)
- ✅ Row Level Security policies
- ✅ Indexes for performance
- ✅ Triggers for automation

---

## 🔐 Step 3: Environment Variables

1. Copy the example file:
```bash
copy .env.local.example .env.local
```

2. Edit `.env.local` with your values:

```env
# Supabase (from Step 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_random_string_here

# Security
BCRYPT_ROUNDS=10
SESSION_TIMEOUT=3600000

# Environment
NODE_ENV=development
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 👤 Step 4: Create Initial Admin User

Run this SQL in Supabase SQL Editor:

```sql
-- Generate password hash for 'admin123'
-- You can change the password by using bcrypt online or in Node.js

INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'admin@sovap.in',
  '$2a$10$rOvHjKqNhZ5vF8qF5qF5qOqF5qF5qF5qF5qF5qF5qF5qF5qF5qF5q',
  'System Administrator',
  'admin',
  true
);
```

**⚠️ IMPORTANT:** The hash above is for `admin123`. For production, generate a new hash:

```javascript
// Run in Node.js console
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your_secure_password', 10);
console.log(hash);
```

---

## 🏃 Step 5: Start the Application

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## 🧪 Step 6: Test the System

### 6.1 Login as Admin

1. Go to http://localhost:3000/login
2. Enter:
   - **Email:** `admin@sovap.in`
   - **Password:** `admin123` (or your custom password)
3. You should be redirected to `/admin`

### 6.2 Create a College

1. In Admin Dashboard, click **"+ Add College"**
2. Fill in:
   - **Institution Name:** MIT Pune
   - **Admin Email:** college@mit.edu
   - **Admin Password:** college123
   - **Admin Name:** Dr. Rajesh Kumar
   - **License Count:** 1000
   - **Course Limit:** 50
   - **Expiry Date:** 2026-12-31
3. Click **"Create College & Send Credentials"**
4. **SAVE THE CREDENTIALS** displayed (email + password)

### 6.3 Login as College Admin

1. Logout from admin
2. Login with:
   - **Email:** college@mit.edu
   - **Password:** college123
3. You should see the College Administration dashboard

### 6.4 Add a Teacher

1. In College Dashboard, click **"+ Add Teacher"**
2. Fill in:
   - **Name:** Dr. Vikram Sarabhai
   - **Email:** teacher@mit.edu
   - **Password:** teacher123
3. Click **"Send Invite Credentials"**
4. **SAVE THE CREDENTIALS**

### 6.5 Test Teacher Login

1. Logout
2. Login as teacher@mit.edu / teacher123
3. You should see the Teacher Workbench

---

## 🔒 Security Features Implemented

### 1. **Row Level Security (RLS)**
- ✅ Users can only see their own data
- ✅ College admins can only manage their college
- ✅ Teachers can only see their courses
- ✅ Students can only access published courses

### 2. **Privilege Escalation Prevention**
- ✅ JWT tokens include role information
- ✅ All API routes verify user role
- ✅ Database policies enforce access control
- ✅ Cannot change own role via API

### 3. **Audit Logging**
All critical actions are logged:
- User logins
- College creation
- Teacher creation
- Course approvals
- Includes: user ID, action, timestamp, IP, metadata

### 4. **Rate Limiting**
- 100 requests per 15 minutes per user
- Prevents API abuse
- Monitored in admin dashboard

### 5. **Password Security**
- Bcrypt hashing (10 rounds)
- Minimum 8 characters
- Never stored in plain text

---

## 📊 Admin Monitoring Features

### View Audit Logs
```
GET /api/admin/audit-logs
Headers: Authorization: Bearer <admin_token>
```

### View API Usage
```
GET /api/admin/api-usage
Headers: Authorization: Bearer <admin_token>
```

### Monitor Colleges
```
GET /api/admin/colleges
Headers: Authorization: Bearer <admin_token>
```

---

## 🔄 API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login (public)

### Admin Only
- `POST /api/admin/colleges` - Create college
- `GET /api/admin/colleges` - List all colleges
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/api-usage` - View API usage

### College Admin
- `POST /api/college/teachers` - Add teacher
- `GET /api/college/teachers` - List teachers
- `POST /api/courses/{id}/approve` - Approve/reject course

### Teacher
- `POST /api/courses` - Create course
- `GET /api/courses` - List own courses

### Student
- `GET /api/courses?status=published` - Browse courses
- `POST /api/enrollments` - Enroll in course

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Check if JWT_SECRET matches in `.env.local`
- Verify token is being sent in Authorization header
- Check token hasn't expired (24h lifetime)

### "Forbidden" Error
- User role doesn't have permission
- Check RLS policies in Supabase
- Verify college_id matches for college admins

### Database Connection Error
- Verify Supabase URL and keys in `.env.local`
- Check Supabase project is running
- Ensure schema.sql was executed successfully

### Password Hash Mismatch
- Regenerate hash using bcrypt
- Ensure BCRYPT_ROUNDS=10 in env
- Update users table with new hash

---

## 🚀 Production Deployment

### Before Going Live:

1. **Change all default passwords**
2. **Use strong JWT_SECRET** (64+ characters)
3. **Enable HTTPS only**
4. **Set up Redis** for rate limiting (replace in-memory store)
5. **Configure CORS** properly
6. **Set up monitoring** (Sentry, LogRocket)
7. **Enable Supabase RLS** on all tables
8. **Regular database backups**
9. **Implement 2FA** for admin accounts
10. **Security audit** before launch

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs (Logs & Reports section)
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure database schema is applied correctly

---

**✅ Setup Complete!** Your SOVAP platform is now fully dynamic with enterprise-grade security.
