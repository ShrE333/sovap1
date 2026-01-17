# SOVAP.in - Quick Start (Mock Mode)

## ✅ Current Status
The platform is running in **MOCK MODE** - this means you can test all features without setting up Supabase.

---

## 🔑 Test Credentials

### Admin Login
- **URL:** http://localhost:3000/login
- **Email:** `admin@sovap.in`
- **Password:** `admin123`
- **Access:** Full platform control

### College Admin Login
- **Email:** `college@mit.edu`
- **Password:** `college123`
- **Access:** Teacher management, course approvals

### Teacher Login
- **Email:** `teacher@mit.edu`
- **Password:** `teacher123`
- **Access:** Course creation, student analytics

### Student Login
- **Email:** `student@mit.edu`
- **Password:** `student123`
- **Access:** Course enrollment, adaptive learning

---

## 🚀 What Works Right Now

### ✅ Fully Functional
- Login system with JWT tokens
- Role-based routing
- All 4 dashboards (Admin, College, Teacher, Student)
- Course selection interface
- Adaptive learning engine
- Progress tracking
- Sidebar navigation

### ⚠️ Mock Mode (No Database)
- College creation (UI works, but data not persisted)
- Teacher creation (UI works, but data not persisted)
- Course approvals (UI works, but data not persisted)

---

## 📝 Testing the Flow

### 1. Login as Admin
```
1. Go to http://localhost:3000/login
2. Enter: admin@sovap.in / admin123
3. You'll see the Admin Dashboard
4. Try clicking "+ Add College" (modal will open)
```

### 2. Login as College
```
1. Logout (click "Sign Out" in sidebar)
2. Login with: college@mit.edu / college123
3. You'll see the College Administration dashboard
4. Try clicking "+ Add Teacher"
```

### 3. Login as Teacher
```
1. Logout
2. Login with: teacher@mit.edu / teacher123
3. You'll see the Teacher Workbench
4. View student performance heatmap
```

### 4. Login as Student
```
1. Logout
2. Login with: student@mit.edu / student123
3. You'll see "My Learning Path" with course cards
4. Click "Continue Learning" on OWASP Top 10
5. Experience the adaptive learning interface
```

---

## 🔄 To Enable Real Database

When you're ready to connect to Supabase:

### 1. Create Supabase Account
- Go to https://supabase.com
- Create a new project
- Wait for initialization (~2 minutes)

### 2. Run Database Schema
- Go to SQL Editor in Supabase
- Copy contents of `d:\SAVAP\supabase\schema.sql`
- Paste and click RUN

### 3. Update Environment Variables
Edit `.env.local`:
```env
# Replace these with your actual Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_key

# Remove or set to false
USE_MOCK_DATA=false
```

### 4. Update Supabase Client
Replace `src/lib/supabase/client.ts` with:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

### 5. Update Login API
Replace `src/app/api/auth/login/route.ts` with the real version from `SETUP_GUIDE.md`

### 6. Restart Server
```bash
npm run dev
```

---

## 🎯 Current Features

### Admin Dashboard
- View platform statistics
- Add colleges (UI ready, needs database)
- Monitor system health
- View API usage (placeholder)

### College Dashboard
- View license usage
- Add teachers (UI ready, needs database)
- Approve courses (UI ready, needs database)
- Monitor enrollment

### Teacher Dashboard
- View student performance
- Track confidence levels
- Identify struggling students
- Course management

### Student Dashboard
- Browse available courses
- View enrollment status
- Track progress
- Access adaptive learning

### Adaptive Learning Engine
- Real-time confidence slider
- Dynamic topic progression
- Interactive labs (unlock at 70% confidence)
- Course-aware AI chatbot interface
- Knowledge verification

---

## 🐛 Troubleshooting

### "Invalid credentials" error
- Make sure you're using the exact credentials above
- Check for typos in email/password
- Try refreshing the page

### Page not loading
- Check if dev server is running (should see "Ready" in terminal)
- Try http://localhost:3000 or http://localhost:3001
- Clear browser cache

### "Unauthorized" after login
- Check browser console for errors
- Try logging out and back in
- Clear localStorage: `localStorage.clear()` in console

---

## 📞 Next Steps

**Option 1: Continue Testing in Mock Mode**
- Explore all dashboards
- Test the adaptive learning flow
- Try different user roles

**Option 2: Set Up Real Database**
- Follow SETUP_GUIDE.md
- Connect to Supabase
- Enable full persistence

**Option 3: Add More Features**
- Integrate Gemma 2 API for AI
- Add MongoDB for course content
- Implement certificate generation

---

**✅ You're all set!** Login with any of the credentials above and explore the platform.
