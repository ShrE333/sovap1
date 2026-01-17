
import { db, saveDb } from '@/lib/mock-db';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Check if we should use Mock data (defaults to true if env is missing or explicitly set to true)
const USE_MOCK = process.env.USE_MOCK_DATA !== 'false';

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
        const { data, error } = await supabaseAdmin.from('users').insert(userData).select().single();
        if (error) throw error;
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
            if (filters.college_id === null) query = query.is('college_id', null);
            else query = query.eq('college_id', filters.college_id);
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
                const studentsCount = db.users.filter(u => u.role === 'student' && u.college_id === college.id).length;
                const coursesCount = db.courses.filter(c => c.college_id === college.id).length;
                const adminUser = db.users.find(u => u.role === 'college' && u.college_id === college.id);

                return {
                    ...college,
                    teachersCount,
                    studentsCount,
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
        const { data, error } = await supabaseAdmin.from('colleges').update(updateData).eq('id', id).select().single();
        if (error) throw error;
        return data;
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
        let query = supabaseAdmin.from('courses').select('*, users!teacher_id(name)');
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
        if (filters.college_id) query = query.eq('college_id', filters.college_id);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((c: any) => ({
            ...c,
            teacherName: c.users?.name || 'Unknown'
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
        const { data, error } = await supabaseAdmin.from('courses').insert(courseData).select().single();
        if (error) throw error;
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
        if (filters.user_id) query = query.eq('user_id', filters.user_id);
        if (filters.course_id) query = query.eq('course_id', filters.course_id);
        const { data, error } = await query;
        if (error) throw error;
        return data;
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
        const { data, error } = await supabaseAdmin.from('enrollments').insert(enrollData).select().single();
        if (error) throw error;
        return data;
    }
};
