
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyAuth(req);
        if (!user || (user.role !== 'college' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { action } = await req.json(); // 'approve' or 'reject'
        const newStatus = action === 'approve' ? 'published' : 'rejected';

        const updatedCourse = await dbClient.updateCourse(id, {
            status: newStatus,
            approved_by: user.id,
            approved_at: new Date().toISOString()
        });

        return NextResponse.json({ course: updatedCourse });
    } catch (error) {
        console.error('Approve course error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
