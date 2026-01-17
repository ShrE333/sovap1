import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/auth/middleware';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100;

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!supabaseAdmin) {
            return NextResponse.json({
                apiUsage: [],
                stats: { totalRequests: 0, avgResponseTime: 0, errorRate: 0, topEndpoints: {} }
            });
        }

        let query = supabaseAdmin
            .from('api_usage')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data: apiUsage, error } = await query;

        if (error) {
            throw error;
        }

        // Calculate statistics
        const stats = {
            totalRequests: apiUsage.length,
            avgResponseTime: apiUsage.reduce((sum, r) => sum + (r.response_time || 0), 0) / apiUsage.length,
            errorRate: (apiUsage.filter(r => r.status_code >= 400).length / apiUsage.length) * 100,
            topEndpoints: {} as Record<string, number>,
        };

        apiUsage.forEach(r => {
            stats.topEndpoints[r.endpoint] = (stats.topEndpoints[r.endpoint] || 0) + 1;
        });

        return NextResponse.json({ apiUsage, stats });
    } catch (error) {
        console.error('Get API usage error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userLimit = rateLimitStore.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
        rateLimitStore.set(userId, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW,
        });
        return true;
    }

    if (userLimit.count >= RATE_LIMIT_MAX) {
        return false;
    }

    userLimit.count++;
    return true;
}

export async function logApiUsage(
    userId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
) {
    if (!supabaseAdmin) return;

    try {
        await supabaseAdmin.from('api_usage').insert({
            user_id: userId,
            endpoint,
            method,
            status_code: statusCode,
            response_time: responseTime,
        });
    } catch (error) {
        console.error('Log API usage error:', error);
    }
}
