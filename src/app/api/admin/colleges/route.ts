import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { db, saveDb } from '@/lib/mock-db';

const createCollegeSchema = z.object({
    name: z.string().min(3),
    adminEmail: z.string().email(),
    adminPassword: z.string().min(8),
    adminName: z.string().min(2),
    licenseCount: z.number().min(1),
    coursesLimit: z.number().min(1),
    licenseExpiry: z.string().min(1, "License Expiry Date is required"),
});

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        console.log('Creating college payload:', body); // Debug log

        const data = createCollegeSchema.parse(body);

        // Check if email already exists in users or colleges
        if (db.users.find(u => u.email === data.adminEmail)) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        const collegeId = `college-${Date.now()}`;

        // Create college
        const college = {
            id: collegeId,
            name: data.name,
            admin_email: data.adminEmail,
            license_count: data.licenseCount,
            courses_limit: data.coursesLimit,
            license_expiry: data.licenseExpiry,
            status: 'active' as const,
            created_at: new Date().toISOString(),
            studentCount: 0,
        };

        // Create college admin user
        const newAdmin = {
            id: `user-${Date.now()}`,
            email: data.adminEmail,
            password_hash: 'mock_hash', // In real app, hash data.adminPassword
            name: data.adminName,
            role: 'college' as const,
            college_id: collegeId,
            is_active: true
        };

        db.colleges.push(college);
        db.users.push(newAdmin);

        saveDb(); // Persist changes

        return NextResponse.json({
            college: {
                id: college.id,
                name: college.name,
                adminEmail: college.admin_email,
                licenseCount: college.license_count,
                coursesLimit: college.courses_limit,
                licenseExpiry: college.license_expiry,
            },
            credentials: {
                email: data.adminEmail,
                password: data.adminPassword,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Create college error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let colleges = db.colleges;

        // Filter based on role
        if (user.role === 'college') {
            colleges = db.colleges.filter(c => c.id === user.collegeId);
        } else if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const enhancedColleges = colleges.map(college => {
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

        return NextResponse.json({ colleges: enhancedColleges });
    } catch (error) {
        console.error('Get colleges error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
