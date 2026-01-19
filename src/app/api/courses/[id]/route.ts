
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await verifyAuth(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = user.role?.toLowerCase();

        // Fetch course to check ownership or context if role is teacher
        const allCourses = await dbClient.getCourses();
        const course = allCourses.find((c: any) => c.id === id);

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Authorization check: Admin, College Admin of the same college, or Teacher as Owner
        const isAdmin = role === 'admin';
        const isCollegeAdmin = role === 'college' && course.college_id === user.collegeId;
        const isOwner = (role === 'teacher' || role === 'college') && course.teacher_id === user.id;

        if (!isAdmin && !isCollegeAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden: Insufficient privileges to purge this unit' }, { status: 403 });
        }

        await dbClient.deleteCourse(id);

        return NextResponse.json({ message: 'Intelligence unit purged successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
