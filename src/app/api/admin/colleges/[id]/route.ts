import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { db, saveDb } from '@/lib/mock-db';

const updateCollegeSchema = z.object({
    licenseCount: z.number().min(1).optional(),
    coursesLimit: z.number().min(1).optional(),
    licenseExpiry: z.string().optional(),
    status: z.enum(['active', 'expired', 'pending']).optional(),
    adminName: z.string().min(2).optional(),
    adminEmail: z.string().email().optional(),
    adminPassword: z.string().min(8).optional(),
});

export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const user = await verifyAuth(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = params;
        const body = await req.json();
        const data = updateCollegeSchema.parse(body);

        const collegeIndex = db.colleges.findIndex(c => c.id === id);

        if (collegeIndex === -1) {
            return NextResponse.json({ error: 'College not found' }, { status: 404 });
        }

        // Update Admin User Credentials if provided
        if (data.adminName || data.adminEmail || data.adminPassword) {
            const adminUserIndex = db.users.findIndex(u => u.role === 'college' && u.college_id === id);
            if (adminUserIndex !== -1) {
                const adminUser = db.users[adminUserIndex];

                // If checking email uniqueness
                if (data.adminEmail && data.adminEmail !== adminUser.email) {
                    if (db.users.find(u => u.email === data.adminEmail)) {
                        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
                    }
                }

                db.users[adminUserIndex] = {
                    ...adminUser,
                    name: data.adminName || adminUser.name,
                    email: data.adminEmail || adminUser.email,
                    // In a real app, hash this!
                    password_hash: data.adminPassword ? 'mock_hash_updated' : adminUser.password_hash,
                };
            }
        }

        // Update college in shared DB
        const updatedCollege = {
            ...db.colleges[collegeIndex],
            ...data,
            license_count: data.licenseCount ?? db.colleges[collegeIndex].license_count,
            courses_limit: data.coursesLimit ?? db.colleges[collegeIndex].courses_limit,
            license_expiry: data.licenseExpiry ?? db.colleges[collegeIndex].license_expiry,
            admin_email: data.adminEmail ?? db.colleges[collegeIndex].admin_email, // Keep consistent
            status: (data.status ?? db.colleges[collegeIndex].status) as 'active' | 'expired' | 'pending',
        };

        db.colleges[collegeIndex] = updatedCollege;

        saveDb();

        return NextResponse.json({ college: updatedCollege });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Update college error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
