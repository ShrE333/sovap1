
import { db, saveDb } from '@/lib/mock-db';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Check if we should use Mock data (defaults to true if env is missing or explicitly set to true)
const USE_MOCK = process.env.USE_MOCK_DATA !== 'false';

// Utility to validate UUID format for Supabase
const isUUID = (str: string | null | undefined): boolean => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
};

export const dbClient = {
    // === USERS ===
    async findUserByEmail(email: string) {
        if (USE_MOCK) {
            return db.users.find(u => u.email === email);
        }
        if (!supabaseAdmin) return null;
        const { data, error } = await supabaseAdmin.from('users').select('*').eq('email', email).single();
        if (error) return null;
        return data;
    },

    async createUser(userData: any) {
        if (USE_MOCK) {
            const newUser = { id: `user-${Date.now()}`, ...userData, is_active: true, created_at: new Date().toISOString() };
            db.users.push(newUser);
            saveDb();
            return newUser;
        }
        if (!supabaseAdmin) throw new Error('Supabase not configured');

        // Sanitize IDs
        const sanitizedData = { ...userData };
        if (sanitizedData.college_id && !isUUID(sanitizedData.college_id)) {
            console.warn(`[dbClient] Stripping invalid college_id UUID: ${sanitizedData.college_id}`);
            delete sanitizedData.college_id;
        }

        const { data, error } = await supabaseAdmin.from('users').insert(sanitizedData).select().single();
        if (error) {
            console.error('Supabase createUser error:', error);
            throw new Error(`User Creation Error: ${error.message}`);
        }
        return data;
    },

    async getUsers(filters: { role?: string, college_id?: string | null } = {}) {
        if (USE_MOCK) {
            let users = [...db.users];
            if (filters.role) users = users.filter(u => u.role === filters.role);
            if (filters.college_id !== undefined) users = users.filter(u => u.college_id === filters.college_id);
            return users;
        }
        if (!supabaseAdmin) return [];
        let query = supabaseAdmin.from('users').select('*');
        if (filters.role) query = query.eq('role', filters.role);
        if (filters.college_id !== undefined) {
            if (filters.college_id === null) {
                query = query.is('college_id', null);
            } else {
                if (!isUUID(filters.college_id)) {
                    console.warn(`[dbClient] getUsers filter college_id is not a UUID: ${filters.college_id}`);
                    return []; // Return empty instead of crashing
                }
                query = query.eq('college_id', filters.college_id);
            }
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // === COLLEGES ===
    async getColleges() {
        if (USE_MOCK) {
            // Simulate joining with stats in mock mode
            return db.colleges.map(college => {
                const teachersCount = db.users.filter(u => u.role === 'teacher' && u.college_id === college.id).length;
                const studentCount = db.users.filter(u => u.role === 'student' && u.college_id === college.id).length;
                const coursesCount = db.courses.filter(c => c.college_id === college.id).length;
                const adminUser = db.users.find(u => u.role === 'college' && u.college_id === college.id);

                return {
                    ...college,
                    teachersCount,
                    studentCount,
                    coursesCount,
                    adminName: adminUser?.name || 'Unknown',
                    aiUsage: Math.floor(Math.random() * 500000) + 10000
                };
            });
        }
        if (!supabaseAdmin) return [];
        // In real app, we use views or joined queries
        const { data, error } = await supabaseAdmin.from('colleges').select('*');
        if (error) throw error;
        return data;
    },

    async createCollege(collegeData: any, adminData: any) {
        if (USE_MOCK) {
            const collegeId = `college-${Date.now()}`;
            const college = { id: collegeId, ...collegeData, created_at: new Date().toISOString() };
            const admin = { id: `user-${Date.now()}`, ...adminData, college_id: collegeId, role: 'college', is_active: true };

            db.colleges.push(college);
            db.users.push(admin);
            saveDb();
            return { college, admin };
        }

        if (!supabaseAdmin) throw new Error('Supabase not configured');

        // Use Supabase Transaction/Logic
        const { data: college, error: cError } = await supabaseAdmin.from('colleges').insert(collegeData).select().single();
        if (cError) throw cError;

        const { data: admin, error: uError } = await supabaseAdmin.from('users').insert({
            ...adminData,
            role: 'college',
            college_id: college.id
        }).select().single();

        if (uError) throw uError;

        return { college, admin };
    },

    async updateCollege(id: string, updateData: any) {
        if (USE_MOCK) {
            const index = db.colleges.findIndex(c => c.id === id);
            if (index === -1) throw new Error('College not found');
            db.colleges[index] = { ...db.colleges[index], ...updateData };

            // Sync admin user if email/name changes
            if (updateData.adminEmail || updateData.adminName || updateData.adminPassword) {
                const adminIndex = db.users.findIndex(u => u.role === 'college' && u.college_id === id);
                if (adminIndex !== -1) {
                    db.users[adminIndex] = {
                        ...db.users[adminIndex],
                        email: updateData.adminEmail || db.users[adminIndex].email,
                        name: updateData.adminName || db.users[adminIndex].name,
                        password_hash: updateData.adminPassword || db.users[adminIndex].password_hash
                    };
                }
            }
            saveDb();
            return db.colleges[index];
        }
        if (!supabaseAdmin) throw new Error('Supabase not configured');

        // Extract and map college table fields
        const collegeFields: any = {};
        if (updateData.name) collegeFields.name = updateData.name;
        if (updateData.admin_email) collegeFields.admin_email = updateData.admin_email;
        if (updateData.license_count !== undefined) collegeFields.license_count = updateData.license_count;
        if (updateData.courses_limit !== undefined) collegeFields.courses_limit = updateData.courses_limit;
        if (updateData.license_expiry) collegeFields.license_expiry = updateData.license_expiry;
        if (updateData.status) collegeFields.status = updateData.status;

        const { data: college, error } = await supabaseAdmin.from('colleges').update(collegeFields).eq('id', id).select().single();
        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }

        // Sync admin user if needed
        const userFields: any = {};
        if (updateData.adminName) userFields.name = updateData.adminName;
        if (updateData.adminEmail) userFields.email = updateData.adminEmail;
        if (updateData.adminPassword) userFields.password_hash = updateData.adminPassword;

        if (Object.keys(userFields).length > 0) {
            const { error: uError } = await supabaseAdmin
                .from('users')
                .update(userFields)
                .eq('college_id', id)
                .eq('role', 'college');

            if (uError) {
                console.error('Admin user sync error:', uError);
                throw uError;
            }
        }

        return college;
    },

    // === COURSES ===
    async getCourses(filters: { status?: string, teacher_id?: string, college_id?: string } = {}) {
        if (USE_MOCK) {
            let courses = [...db.courses];
            if (filters.status) courses = courses.filter(c => c.status === filters.status);
            if (filters.teacher_id) courses = courses.filter(c => c.teacher_id === filters.teacher_id);
            if (filters.college_id) courses = courses.filter(c => c.college_id === filters.college_id);

            return courses.map(c => {
                const teacher = db.users.find(u => u.id === c.teacher_id);
                return {
                    ...c,
                    teacherName: teacher?.name || 'Unknown'
                };
            });
        }
        if (!supabaseAdmin) return [];

        let query = supabaseAdmin.from('courses').select('*');
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
        if (filters.college_id) query = query.eq('college_id', filters.college_id);

        const { data, error } = await query;
        if (error) throw error;

        // Fetch teachers for these courses to avoid complex join errors
        const teacherIds = Array.from(new Set((data || []).map((c: any) => c.teacher_id).filter(Boolean)));
        let teachersMap: Record<string, { name: string, role: string }> = {};

        if (teacherIds.length > 0) {
            const { data: teachers } = await supabaseAdmin.from('users').select('id, name, role').in('id', teacherIds);
            teachersMap = (teachers || []).reduce((acc: any, t: any) => ({ ...acc, [t.id]: { name: t.name, role: t.role } }), {});
        }

        return (data || []).map((c: any) => ({
            ...c,
            teacherName: teachersMap[c.teacher_id]?.name || 'Unknown',
            creatorRole: teachersMap[c.teacher_id]?.role || 'unknown'
        }));
    },

    async createCourse(courseData: any) {
        if (USE_MOCK) {
            const course = {
                id: `course-${Date.now()}`,
                ...courseData,
                status: 'pending_approval',
                created_at: new Date().toISOString()
            };
            db.courses.push(course);
            saveDb();
            return course;
        }
        if (!supabaseAdmin) throw new Error('Supabase not configured');

        // Sanitize IDs for Supabase (must be valid UUIDs)
        const sanitizedData = { ...courseData };
        if (sanitizedData.college_id && !isUUID(sanitizedData.college_id)) {
            console.warn(`[dbClient] Stripping invalid college_id UUID: ${sanitizedData.college_id}`);
            delete sanitizedData.college_id;
        }
        if (sanitizedData.teacher_id && !isUUID(sanitizedData.teacher_id)) {
            console.warn(`[dbClient] Stripping invalid teacher_id UUID: ${sanitizedData.teacher_id}`);
            delete sanitizedData.teacher_id;
        }

        const { data, error } = await supabaseAdmin.from('courses').insert(sanitizedData).select().single();
        if (error) {
            console.error('Supabase createCourse error details:', error);
            throw new Error(`Database Error: ${error.message} (Code: ${error.code})`);
        }
        return data;
    },

    async updateCourse(id: string, updateData: any) {
        if (USE_MOCK) {
            const index = db.courses.findIndex(c => c.id === id);
            if (index === -1) throw new Error('Course not found');
            db.courses[index] = { ...db.courses[index], ...updateData };
            saveDb();
            return db.courses[index];
        }
        if (!supabaseAdmin) throw new Error('Supabase not configured');
        const { data, error } = await supabaseAdmin.from('courses').update(updateData).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteCourse(id: string) {
        if (USE_MOCK) {
            // Cascade delete enrollments
            db.enrollments = db.enrollments.filter(e => e.course_id !== id);

            const index = db.courses.findIndex(c => c.id === id);
            if (index === -1) return;
            db.courses.splice(index, 1);
            saveDb();
            return;
        }
        if (!supabaseAdmin) throw new Error('Supabase not configured');

        // Cascade delete enrollments (if not handled by DB constraint)
        await supabaseAdmin.from('enrollments').delete().eq('course_id', id);

        const { error } = await supabaseAdmin.from('courses').delete().eq('id', id);
        if (error) throw error;
    },

    // === ENROLLMENTS ===
    async getEnrollments(filters: { user_id?: string, course_id?: string } = {}) {
        if (USE_MOCK) {
            let enrollments = [...db.enrollments];
            if (filters.user_id) enrollments = enrollments.filter(e => e.user_id === filters.user_id);
            if (filters.course_id) enrollments = enrollments.filter(e => e.course_id === filters.course_id);
            return enrollments;
        }
        if (!supabaseAdmin) return [];
        let query = supabaseAdmin.from('enrollments').select('*');
        if (filters.user_id) query = query.eq('student_id', filters.user_id);
        if (filters.course_id) query = query.eq('course_id', filters.course_id);
        const { data, error } = await query;
        if (error) {
            console.error('Supabase getEnrollments error:', error);
            throw error;
        }

        // Map student_id back to user_id for frontend consistency
        return (data || []).map((e: any) => ({
            ...e,
            user_id: e.student_id
        }));
    },

    async createEnrollment(enrollData: any) {
        if (USE_MOCK) {
            const enrollment = {
                id: `enroll-${Date.now()}`,
                ...enrollData,
                progress: 0,
                status: 'active',
                created_at: new Date().toISOString()
            };
            db.enrollments.push(enrollment);
            saveDb();
            return enrollment;
        }
        if (!supabaseAdmin) throw new Error('Supabase not configured');

        // Map user_id to student_id for Supabase
        const supabaseData: any = {
            course_id: enrollData.course_id,
            progress: enrollData.progress || 0
        };

        // Ensure IDs are valid UUIDs
        if (isUUID(enrollData.user_id)) {
            supabaseData.student_id = enrollData.user_id;
        }
        if (!isUUID(enrollData.course_id)) {
            throw new Error('Invalid Course ID format (UUID expected)');
        }

        const { data, error } = await supabaseAdmin.from('enrollments').insert(supabaseData).select().single();
        if (error) {
            console.error('Supabase createEnrollment error:', error);
            throw new Error(`Enrollment Error: ${error.message}`);
        }

        return {
            ...data,
            user_id: data.student_id
        };
    },

    async enrollStudent(userId: string, courseId: string) {
        // Wrapper for createEnrollment to handle duplicate checks if needed
        const existing = await this.getEnrollments({ user_id: userId, course_id: courseId });
        if (existing.length > 0) {
            return existing[0]; // Already enrolled
        }
        return await this.createEnrollment({ user_id: userId, course_id: courseId });
    },

    async updateEnrollment(userId: string, courseId: string, updates: { progress?: number; status?: 'active' | 'completed'; current_topic?: string }) {
        if (USE_MOCK) {
            const index = db.enrollments.findIndex(e => e.user_id === userId && e.course_id === courseId);
            if (index === -1) throw new Error('Enrollment not found');
            db.enrollments[index] = { ...db.enrollments[index], ...updates };
            saveDb();
            return db.enrollments[index];
        }
        if (!supabaseAdmin) throw new Error('Supabase not configured');

        // Find enrollment by student_id and course_id
        const { data: enrollments } = await supabaseAdmin
            .from('enrollments')
            .select('*')
            .eq('student_id', userId)
            .eq('course_id', courseId);

        if (!enrollments || enrollments.length === 0) {
            throw new Error('Enrollment not found');
        }

        const { data, error } = await supabaseAdmin
            .from('enrollments')
            .update(updates)
            .eq('student_id', userId)
            .eq('course_id', courseId)
            .select()
            .single();

        if (error) {
            console.error('Supabase updateEnrollment error:', error);
            throw error;
        }

        return {
            ...data,
            user_id: data.student_id
        };
    },

    // === LEARNING STATE (Phase 0/6) ===
    async getLearningState(userId: string, courseId: string) {
        if (USE_MOCK) {
            const enrollment = db.enrollments.find(e => e.user_id === userId && e.course_id === courseId);
            return enrollment?.learningState || null;
        }
        // Supabase fallback (assumes metadata column exists or handled separately)
        return null;
    },

    async updateLearningState(userId: string, courseId: string, state: any) {
        if (USE_MOCK) {
            const index = db.enrollments.findIndex(e => e.user_id === userId && e.course_id === courseId);
            if (index === -1) throw new Error('Enrollment not found');

            const current = db.enrollments[index].learningState || {};
            db.enrollments[index].learningState = { ...current, ...state };
            saveDb();
            return db.enrollments[index].learningState;
        }
        // Supabase fallback
        return null;
    }
};
