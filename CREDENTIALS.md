# SOVAP.in - Test Credentials

## Admin Access
**Email:** admin@sovap.in  
**Password:** admin123  
**Access:** Global platform control, college management, license allocation

---

## College Admin Access

### MIT World Peace University
**Email:** college@mit.edu  
**Password:** college123  
**Access:** Teacher management, student oversight, course approvals  
**License:** 1540/2000 students | 50 course limit

### IIT Bombay
**Email:** college@iitb.ac.in  
**Password:** college123  
**Access:** Teacher management, student oversight, course approvals  
**License:** 850/1000 students | 30 course limit

---

## Teacher Access

### Dr. Vikram Sarabhai (MIT Pune)
**Email:** teacher@mit.edu  
**Password:** teacher123  
**Access:** Course creation, student analytics, AI course generator  
**Courses:** 3 active

### Prof. Satish Dhawan (MIT Pune)
**Email:** satish@mit.edu  
**Password:** teacher123  
**Access:** Course creation, student analytics  
**Courses:** 2 active

---

## Student Access

### Aryan Sharma (MIT Pune)
**Email:** student@mit.edu  
**Password:** student123  
**Access:** Adaptive learning, course enrollment, progress tracking  
**Enrolled:** OWASP Top 10 (15% complete)

### Priya Patel (MIT Pune)
**Email:** priya@mit.edu  
**Password:** student123  
**Access:** Adaptive learning, course enrollment  
**Enrolled:** None

### Rahul Kumar (IIT Bombay)
**Email:** rahul@iitb.ac.in  
**Password:** student123  
**Access:** Adaptive learning, course enrollment  
**Enrolled:** Machine Learning Fundamentals

---

## Role Detection Logic
The system automatically detects roles based on email patterns:
- Contains `admin@sovap` → **Admin**
- Contains `college@` → **College Admin**
- Contains `teacher@` or specific teacher emails → **Teacher**
- All other emails → **Student** (default)

---

## Key Features by Role

### Admin
- Add/Edit colleges with license limits
- Set course generation quotas per college
- Monitor global AI system health
- Approve courses across all institutions

### College
- Add teachers and send credentials
- Approve teacher-generated courses
- Monitor student enrollment and performance
- Manage institutional license usage

### Teacher
- Generate AI-powered courses
- Track student confidence heatmaps
- Identify struggling students
- Submit courses for college approval

### Student
- Browse and enroll in courses
- Experience adaptive learning paths
- Complete interactive labs
- Track skill mastery and earn certificates
