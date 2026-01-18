
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Generate a unique Course ID
        const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
        const courseId = `PDF-${randomString}`;

        // In a real app, you would:
        // 1. Move the file to storage (e.g. Supabase Storage)
        // 2. Extract text using pdf-parse or OCR
        // 3. Send text to LLM to generate modules

        // For this demo, we simulate a "Full Fledged Course" structure
        // We remove 'id', 'level', and 'category' as they don't exist in the current SQL schema
        const course = await dbClient.createCourse({
            title: title || 'New PDF Course',
            description: `Auto-generated course from uploaded document: ${file.name}`,
            teacher_id: user.id,
            college_id: user.collegeId,
            status: 'pending_approval',
            modules: []
        });

        // Trigger AI Course Generation Lab with PDF
        const generatorUrl = process.env.GENERATOR_LAB_URL || 'http://localhost:8000';

        try {
            const forwardData = new FormData();
            forwardData.append('file', file);
            forwardData.append('title', course.title);

            // Forward to Python Lab
            fetch(`${generatorUrl}/generate-from-pdf`, {
                method: 'POST',
                body: forwardData,
            }).catch(e => console.error("Generator Lab PDF Trigger Failed:", e));
        } catch (e) {
            console.error("Generator PDF Linkage Failed:", e);
        }

        return NextResponse.json({
            message: 'Course generation started from PDF',
            courseId: course.id,
            course
        });

    } catch (error) {
        console.error('PDF Course Generation Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
