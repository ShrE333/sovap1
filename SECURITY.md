# SOVAP.in - Security Architecture

## 🔐 Security Layers

### 1. Authentication & Authorization

#### JWT Token-Based Auth
- **Token Lifetime:** 24 hours
- **Algorithm:** HS256
- **Payload:** User ID, email, role, college ID
- **Storage:** LocalStorage (client), HTTP-only cookies (future)

#### Password Security
- **Algorithm:** bcrypt
- **Rounds:** 10 (2^10 = 1024 iterations)
- **Min Length:** 8 characters
- **Storage:** Hashed only, never plain text

---

### 2. Row Level Security (RLS)

#### Supabase RLS Policies

**Users Table:**
```sql
-- Users can view their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- College admins can view their college users
CREATE POLICY "College admins can view their college users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'college' 
            AND u.college_id = users.college_id
        )
    );
```

**Courses Table:**
```sql
-- Anyone can view published courses
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (status = 'published');

-- Teachers can manage their own courses
CREATE POLICY "Teachers can manage their own courses" ON courses
    FOR ALL USING (teacher_id = auth.uid());

-- College admins can manage their college courses
CREATE POLICY "College admins can manage their college courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'college' 
            AND college_id = courses.college_id
        )
    );
```

---

### 3. Privilege Escalation Prevention

#### API Route Protection
```typescript
// Example: Admin-only route
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Admin logic here
}
```

#### Role Verification Chain
1. **Client sends JWT** in Authorization header
2. **Server verifies JWT** signature and expiry
3. **Extracts user role** from token payload
4. **Checks role permissions** for endpoint
5. **Database RLS** enforces additional checks

#### Cannot Escalate Via:
- ❌ Modifying JWT client-side (signature verification fails)
- ❌ Changing role in database (RLS prevents)
- ❌ API manipulation (role checked server-side)
- ❌ Direct database access (RLS policies active)

---

### 4. Audit Logging

#### What Gets Logged
```typescript
interface AuditLog {
  user_id: UUID;
  action: string;        // LOGIN, CREATE_COLLEGE, APPROVE_COURSE, etc.
  resource_type: string; // user, college, course, etc.
  resource_id: UUID;
  ip_address: string;
  user_agent: string;
  metadata: JSON;        // Additional context
  created_at: timestamp;
}
```

#### Critical Actions Logged
- ✅ User login/logout
- ✅ College creation
- ✅ Teacher creation
- ✅ Course creation
- ✅ Course approval/rejection
- ✅ License modifications
- ✅ Role changes (if implemented)

#### Admin Monitoring
```
GET /api/admin/audit-logs?userId=xxx&action=LOGIN&limit=100
```

---

### 5. Rate Limiting

#### Implementation
```typescript
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // requests

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
```

#### Per-User Limits
- **100 requests** per 15 minutes
- **Applies to:** All authenticated endpoints
- **Response:** 429 Too Many Requests
- **Monitoring:** Tracked in `api_usage` table

#### Production Recommendation
```typescript
// Use Redis for distributed rate limiting
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 900); // 15 minutes
  }
  
  return current <= 100;
}
```

---

### 6. API Usage Monitoring

#### Tracked Metrics
```typescript
interface APIUsage {
  user_id: UUID;
  endpoint: string;      // /api/courses
  method: string;        // GET, POST, etc.
  status_code: number;   // 200, 401, 500, etc.
  response_time: number; // milliseconds
  created_at: timestamp;
}
```

#### Admin Dashboard Stats
- Total requests
- Average response time
- Error rate (4xx, 5xx)
- Top endpoints
- Per-user usage

---

### 7. Input Validation

#### Using Zod Schemas
```typescript
import { z } from 'zod';

const createCollegeSchema = z.object({
  name: z.string().min(3),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  licenseCount: z.number().min(1),
  coursesLimit: z.number().min(1),
  licenseExpiry: z.string(),
});

// Validates and throws ZodError if invalid
const data = createCollegeSchema.parse(body);
```

#### Prevents
- SQL injection (parameterized queries)
- XSS (input sanitization)
- Type confusion
- Missing required fields
- Invalid email formats

---

### 8. Database Security

#### Supabase Features
- ✅ **SSL/TLS** encryption in transit
- ✅ **Encryption at rest** for all data
- ✅ **Automatic backups** (daily)
- ✅ **Point-in-time recovery**
- ✅ **Connection pooling**
- ✅ **Read replicas** (paid plans)

#### Access Control
- **Service Role Key:** Server-side only (bypasses RLS)
- **Anon Key:** Client-side (RLS enforced)
- **Never expose** service role key in frontend

---

### 9. CORS & Headers

#### Next.js Middleware (Future)
```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
  
  return response;
}
```

---

### 10. Production Checklist

#### Before Launch
- [ ] Change all default passwords
- [ ] Use 64+ character JWT_SECRET
- [ ] Enable HTTPS only (no HTTP)
- [ ] Set up Redis for rate limiting
- [ ] Configure CORS whitelist
- [ ] Enable Supabase RLS on ALL tables
- [ ] Set up automated backups
- [ ] Implement 2FA for admin
- [ ] Security audit/penetration testing
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure WAF (Web Application Firewall)
- [ ] Implement CSRF protection
- [ ] Add rate limiting to login endpoint
- [ ] Set up DDoS protection (Cloudflare)
- [ ] Regular dependency updates
- [ ] Code signing for releases

---

## 🚨 Incident Response

### If Breach Detected
1. **Immediately revoke** all JWT tokens
2. **Force password reset** for all users
3. **Review audit logs** for suspicious activity
4. **Notify affected users** within 24h
5. **Patch vulnerability** ASAP
6. **Document incident** for compliance

### Monitoring Alerts
- Multiple failed login attempts
- Unusual API usage patterns
- Privilege escalation attempts
- Database query anomalies
- Unexpected admin actions

---

## 📊 Compliance

### GDPR Considerations
- User data deletion API
- Data export functionality
- Consent management
- Privacy policy
- Cookie consent

### FERPA (Education)
- Student data protection
- Access control
- Audit trails
- Data retention policies

---

**Security is not a feature, it's a foundation.**
