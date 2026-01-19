
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

        // Try to fetch from GitHub (Private/Public) using Token
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || 'ShrE333/sovap1';
        const branch = process.env.GITHUB_BRANCH || 'main'; // Default branch

        // Construct GitHub API URL for contents
        // Note: Using raw.githubusercontent with header is better for content
        // Or API: https://api.github.com/repos/{owner}/{repo}/contents/{path}

        // Let's try raw URL with Authorization header
        const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/courses/${id}/master.json`;

        const ghRes = await fetch(rawUrl, {
            headers: token ? {
                'Authorization': `token ${token}`
            } : {}
        });

        if (ghRes.ok) {
            const data = await ghRes.json();
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
