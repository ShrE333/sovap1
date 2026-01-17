
import fs from 'fs';
import path from 'path';

export interface MockUser {
    id: string;
    email: string;
    password_hash: string;
    name: string;
    role: 'admin' | 'college' | 'teacher' | 'student';
    college_id?: string | null;
    is_active: boolean;
}

export interface MockCollege {
    id: string;
    name: string;
    admin_email: string;
    license_count: number;
    courses_limit: number;
    license_expiry: string;
    status: 'active' | 'expired' | 'pending';
    created_at: string;
    studentCount: number;
}

export interface MockCourse {
    id: string;
    title: string;
    description: string;
    college_id: string;
    teacher_id: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
    modules: any[];
    estimated_hours: number;
    created_at: string;
    approved_by?: string;
    approved_at?: string;
}

export interface MockEnrollment {
    id: string;
    user_id: string;
    course_id: string;
    progress: number;
    status: 'active' | 'completed';
    created_at: string;
}

// Initial Mock Data Structure
const defaultData = {
    users: [
        {
            id: 'admin-001',
            email: 'admin@sovap.in',
            password_hash: '$2a$10$rOvHjKqNhZ5vF8qF5qF5qOqF5qF5qF5qF5qF5qF5qF5qF5qF5qF5q', // admin123
            name: 'System Administrator',
            role: 'admin',
            college_id: null,
            is_active: true,
        }
    ] as MockUser[],
    colleges: [] as MockCollege[],
    courses: [] as MockCourse[],
    enrollments: [] as MockEnrollment[],
};

// Persistence Logic
const DB_PATH = path.join(process.cwd(), 'data', 'mock-db.json');

let loadedData = { ...defaultData };

try {
    if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        const json = JSON.parse(fileContent);
        // Merge with default to ensure structure integrity
        loadedData = {
            users: json.users || defaultData.users,
            colleges: json.colleges || defaultData.colleges,
            courses: json.courses || defaultData.courses,
            enrollments: json.enrollments || defaultData.enrollments,
        };
        // Ensure Admin always exists
        if (!loadedData.users.find(u => u.role === 'admin')) {
            loadedData.users.push(defaultData.users[0]);
        }
    }
} catch (error) {
    console.warn('Failed to load mock-db.json, starting with fresh data:', error);
}

export const db = loadedData;

export const saveDb = () => {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Mock DB saved to disk.');
    } catch (error) {
        console.error('Failed to save mock-db.json:', error);
    }
};
