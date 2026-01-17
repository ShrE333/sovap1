
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { dbClient } from '@/lib/db-client';

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
        const { id } = await props.params;
        const user = await verifyAuth(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const data = updateCollegeSchema.parse(body);

        const updatedCollege = await dbClient.updateCollege(id, {
            ...data,
            license_count: data.licenseCount,
            courses_limit: data.coursesLimit,
            license_expiry: data.licenseExpiry ? new Date(data.licenseExpiry).toISOString() : undefined,
            admin_email: data.adminEmail,
        });

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
