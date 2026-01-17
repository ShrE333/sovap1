import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabaseAdmin
            .from('audit_logs')
            .select('*, users(name, email)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (action) {
            query = query.eq('action', action);
        }

        const { data: logs, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Get audit logs error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
