-- SOVAP Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (Core Authentication)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'college', 'teacher', 'student')),
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- =====================================================
-- COLLEGES TABLE
-- =====================================================
CREATE TABLE colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) UNIQUE NOT NULL,
    license_count INTEGER NOT NULL DEFAULT 0,
    courses_limit INTEGER NOT NULL DEFAULT 0,
    license_expiry TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- COURSES TABLE
-- =====================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published')),
    modules JSONB NOT NULL DEFAULT '[]',
    estimated_hours INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP
);

-- =====================================================
-- ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- =====================================================
-- LEARNING STATES TABLE (Adaptive Engine Data)
-- =====================================================
CREATE TABLE learning_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    topic_confidence JSONB DEFAULT '{}',
    topic_mastery JSONB DEFAULT '{}',
    attempt_history JSONB DEFAULT '[]',
    lab_status JSONB DEFAULT '{}',
    current_path JSONB DEFAULT '[]',
    last_active TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- =====================================================
-- AUDIT LOG TABLE (Security & Monitoring)
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- API USAGE TABLE (Rate Limiting & Monitoring)
-- =====================================================
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_college ON users(college_id);
CREATE INDEX idx_courses_college ON courses(college_id);
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_learning_states_student ON learning_states(student_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_api_usage_user ON api_usage(user_id);
CREATE INDEX idx_api_usage_created ON api_usage(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "College admins can view their college users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'college' 
            AND u.college_id = users.college_id
        )
    );

-- Colleges Table Policies
CREATE POLICY "Admins can manage all colleges" ON colleges
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "College admins can view their own college" ON colleges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND college_id = colleges.id
        )
    );

-- Courses Table Policies
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (status = 'published');

CREATE POLICY "Teachers can manage their own courses" ON courses
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "College admins can manage their college courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'college' 
            AND college_id = courses.college_id
        )
    );

-- Enrollments Table Policies
CREATE POLICY "Students can view their own enrollments" ON enrollments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can enroll in courses" ON enrollments
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Learning States Policies
CREATE POLICY "Students can manage their own learning state" ON learning_states
    FOR ALL USING (student_id = auth.uid());

-- Audit Logs Policies (Admin only)
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check license limits
CREATE OR REPLACE FUNCTION check_license_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    license_limit INTEGER;
BEGIN
    SELECT COUNT(*), c.license_count 
    INTO current_count, license_limit
    FROM users u
    JOIN colleges c ON u.college_id = c.id
    WHERE u.college_id = NEW.college_id AND u.role = 'student'
    GROUP BY c.license_count;
    
    IF current_count >= license_limit THEN
        RAISE EXCEPTION 'License limit reached for this college';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply license check trigger
CREATE TRIGGER check_student_license_limit 
    BEFORE INSERT ON users
    FOR EACH ROW 
    WHEN (NEW.role = 'student')
    EXECUTE FUNCTION check_license_limit();

-- =====================================================
-- INITIAL ADMIN USER (Run separately after setup)
-- =====================================================
-- INSERT INTO users (email, password_hash, name, role) 
-- VALUES ('admin@sovap.in', '$2a$10$...', 'System Administrator', 'admin');
