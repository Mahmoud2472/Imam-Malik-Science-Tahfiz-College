import { createClient } from '@supabase/supabase-js';

// Configuration using your provided keys
const SUPABASE_URL: string = 'https://ywlwzbaydhnkjdoxcvby.supabase.co';
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bHd6YmF5ZGhua2pkb3hjdmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2Mzc2NDIsImV4cCI6MjA4MDIxMzY0Mn0._zZyzTwdmdUZarxEzuc_S3VOHoUbktuWV9nUZwdT5C0';

export const isSupabaseConfigured = (): boolean => true; // Always true for this setup

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const signOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
};