import { createClient } from '@supabase/supabase-js';

// 1. Replace this URL with your Supabase Project URL
const SUPABASE_URL = "https://iwjaolxtvqwrfoihufxt.supabase.co";

// 2. Replace this key with your Supabase anon/public key
const SUPABASE_PUBLIC_KEY = "sb_publishable__QbpGfvVQJW8RopPIMCmFA_TDXk5mZv";

// 3. Export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
