
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { dbClient } from '@/lib/db-client';

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
        const data = createCollegeSchema.parse(body);

        // Check if admin user already exists
        const existingUser = await dbClient.findUserByEmail(data.adminEmail);
        if (existingUser) {
            return NextResponse.json({ error: 'Admin email already registered' }, { status: 400 });
        }

        const collegePayload = {
            name: data.name,
            admin_email: data.adminEmail,
            license_count: data.licenseCount,
            courses_limit: data.coursesLimit,
            license_expiry: new Date(data.licenseExpiry).toISOString(),
            status: 'active',
        };

        const adminPayload = {
            email: data.adminEmail,
            name: data.adminName,
            password_hash: data.adminPassword, // Mock: password is hash or plain for now
        };

        const result = await dbClient.createCollege(collegePayload, adminPayload);

        return NextResponse.json({
            college: result.college,
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
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const colleges = await dbClient.getColleges();

        return NextResponse.json({ colleges });
    } catch (error) {
        console.error('Get colleges error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
