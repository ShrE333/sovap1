import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Safe initialization to prevent build-time crashes if URL is invalid
const isValidUrl = supabaseUrl?.startsWith('http');

export const supabaseAdmin = (isValidUrl && serviceRoleKey)
    ? createClient(supabaseUrl!, serviceRoleKey)
    : null;
