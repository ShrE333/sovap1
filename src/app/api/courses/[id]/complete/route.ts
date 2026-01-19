
import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db-client';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status, modules_count } = await req.json();

        console.log(`[*] Received generation completion for course ${id} with status ${status}`);

        // Update course status to pending_approval and set module count
        const updatedCourse = await dbClient.updateCourse(id, {
            status: status || 'pending_approval',
            modules_count: modules_count || 0
        });

        return NextResponse.json({ success: true, course: updatedCourse });
    } catch (error) {
        console.error('Course completion callback error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
