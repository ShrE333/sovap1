import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/mock-db';

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const user = await verifyAuth(req);
        if (!user || (user.role !== 'college' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = params;
        const { action } = await req.json(); // 'approve' or 'reject'

        // Find course
        const courseIndex = db.courses.findIndex(c => c.id === id);
        if (courseIndex === -1) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const course = db.courses[courseIndex];

        // Verify college admin can only approve their own college's courses
        if (user.role === 'college' && course.college_id !== user.collegeId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Determine new status
        // If approved, it goes to 'published' immediately for simplicity in this mock,
        // or 'approved' then a separate publish step? 
        // The previous code used 'approved'. Student API filters for 'published'. 
        // Let's make it 'published' so students can see it immediately after approval.
        // Or stick to 'approved' and fix student filter? 
        // The previous schema supported both. Let's say approval publishes it.
        const newStatus = action === 'approve' ? 'published' : 'rejected';

        const updatedCourse = {
            ...course,
            status: newStatus as any,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
        };

        db.courses[courseIndex] = updatedCourse;

        return NextResponse.json({ course: updatedCourse });
    } catch (error) {
        console.error('Approve course error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
