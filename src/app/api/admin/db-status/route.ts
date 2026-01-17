
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const mode = process.env.USE_MOCK_DATA !== 'false' ? 'Mock' : 'Supabase';
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Set';
        const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

        let connectionStatus = 'Unknown';
        let tables: string[] = [];
        let error: any = null;

        if (mode === 'Supabase') {
            if (!supabaseAdmin) {
                connectionStatus = 'Disconnected (Client not initialized - Check Keys)';
            } else {
                // Try to fetch a simple record to check connection
                const { data, error: dbError } = await supabaseAdmin.from('users').select('id').limit(1);
                if (dbError) {
                    connectionStatus = `Error: ${dbError.message}`;
                    error = dbError;
                } else {
                    connectionStatus = 'Connected';
                    // Check other tables
                    const checks = ['colleges', 'courses', 'enrollments'];
                    for (const table of checks) {
                        const { error: tError } = await supabaseAdmin.from(table).select('id').limit(1);
                        if (!tError) tables.push(table);
                    }
                }
            }
        }

        return NextResponse.json({
            mode,
            url,
            hasServiceKey,
            connectionStatus,
            availableTables: tables,
            diagnostic: error
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
