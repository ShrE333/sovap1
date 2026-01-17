import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fallback Mock Client if keys are missing (prevents crash during migration)
const mockClient = {
    from: (table: string) => ({
        select: () => ({
            eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
            }),
            limit: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => ({
            select: () => ({
                single: () => Promise.resolve({ data: {}, error: null }),
            }),
        }),
        update: () => ({
            eq: () => ({
                select: () => ({
                    single: () => Promise.resolve({ data: {}, error: null }),
                }),
            }),
        }),
        delete: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
        }),
    }),
};

const isValidUrl = supabaseUrl?.startsWith('http');

export const supabase = (isValidUrl && supabaseKey)
    ? createClient(supabaseUrl!, supabaseKey)
    : (mockClient as any);
