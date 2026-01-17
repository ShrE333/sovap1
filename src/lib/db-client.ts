
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
    }
};
