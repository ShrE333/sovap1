
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;

    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try primary storage first, then fallback to project repo
        const token = process.env.GITHUB_TOKEN;
        const branch = process.env.GITHUB_BRANCH || 'main'; // Default branch
        const reposToCheck = ['ShrE333/sovap-course-storage', 'ShrE333/sovap1'];
        let data = null;

        for (const targetRepo of reposToCheck) {
            try {
                const rawUrl = `https://raw.githubusercontent.com/${targetRepo}/${branch}/courses/${id}/master.json`;
                console.log(`[Proxy] Checking ${rawUrl}`);
                const ghRes = await fetch(rawUrl, {
                    headers: token ? { 'Authorization': `token ${token}` } : {}
                });

                if (ghRes.ok) {
                    data = await ghRes.json();
                    break; // Found it!
                }
            } catch (e) {
                console.warn(`[Proxy] Failed to check ${targetRepo}`, e);
            }
        }

        if (data) {
            return NextResponse.json(data);
        }

        // Fallback: Check local storage (if running locally or volume mounted)
        // Accessing file system in Next.js API route
        try {
            const fs = await import('fs');
            const path = await import('path');
            const localPath = path.join(process.cwd(), 'storage', id, 'master.json');

            if (fs.existsSync(localPath)) {
                const fileContent = fs.readFileSync(localPath, 'utf-8');
                return NextResponse.json(JSON.parse(fileContent));
            }
        } catch (e) {
            // Local read failed
        }

        return NextResponse.json({ error: 'Course content not found' }, { status: 404 });

    } catch (error) {
        console.error('Course content fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
