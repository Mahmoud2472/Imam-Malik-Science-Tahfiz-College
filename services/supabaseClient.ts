import { createClient } from '@supabase/supabase-js';

// Configuration using your provided keys
const SUPABASE_URL: string = 'https://mndbrtgdfunvdpuxirju.supabase.co';
const SUPABASE_ANON_KEY: string = 'sb_publishable_h6GDZ79sdzU9mKpXc77E9w_bFXItdYe';

export const isSupabaseConfigured = (): boolean => true; // Always true for this setup

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const signOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
};