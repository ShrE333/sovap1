
import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function GET(req: NextRequest) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        // Fetch full user details (to get Name)
        const user = await dbClient.findUserByEmail(authUser.email);
        const userName = user?.name || authUser.email; // Fallback to email if name missing

        // Verify completion
        const enrollments = await dbClient.getEnrollments({ user_id: authUser.id, course_id: courseId });
        const enrollment = enrollments[0];

        // Ensure progress is 100% or explicitly marked complete
        if (!enrollment || (enrollment.progress || 0) < 100) {
            return NextResponse.json({ error: 'Course not completed yet. Complete all modules to unlock certificate.' }, { status: 403 });
        }

        // Get Course Details
        const courses = await dbClient.getCourses();
        const course = courses.find((c: any) => c.id === courseId);

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Create PDF
        const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));

        return new Promise<NextResponse>((resolve) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const response = new NextResponse(pdfBuffer, {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="certificate-${courseId}.pdf"`,
                    },
                });
                resolve(response);
            });

            // --- PDF DESIGN ---
            const verificationCode = `V-${courseId.slice(0, 4).toUpperCase()}-${authUser.id.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

            // Border
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                .lineWidth(3)
                .stroke('#FF5A36');

            // Header
            doc.moveDown(2);
            doc.font('Helvetica-Bold').fontSize(40).fillColor('#1F2937').text('CERTIFICATE', { align: 'center' });
            doc.fontSize(20).text('OF COMPLETION', { align: 'center', characterSpacing: 5 });

            doc.moveDown(2);
            doc.fontSize(14).font('Helvetica').fillColor('#6B7280').text('This is to certify that', { align: 'center' });

            doc.moveDown(1);
            doc.font('Helvetica-Bold').fontSize(32).fillColor('#3D8D95').text(userName, { align: 'center' });

            doc.moveDown(1);
            doc.font('Helvetica').fontSize(14).fillColor('#6B7280').text('has successfully completed the comprehensive course', { align: 'center' });

            doc.moveDown(1);
            doc.font('Helvetica-Bold').fontSize(26).fillColor('#1F2937').text(course.title, { align: 'center' });

            doc.moveDown(3);

            // Footer Area
            doc.font('Helvetica').fontSize(12).fillColor('#374151');
            doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 60, doc.page.height - 100);
            doc.text(`Verification ID: ${verificationCode}`, 60, doc.page.height - 80);

            // Signature (Mock)
            doc.text('SOVAP Learning Platform', doc.page.width - 250, doc.page.height - 100, { align: 'center' });
            doc.moveTo(doc.page.width - 250, doc.page.height - 105).lineTo(doc.page.width - 50, doc.page.height - 105).stroke('#374151');
            doc.fontSize(10).text('Authorized Signature', doc.page.width - 250, doc.page.height - 80, { align: 'center' });

            doc.end();
        });

    } catch (error) {
        console.error('Certificate generation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
