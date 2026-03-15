import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://iwjaolxtvqwrfoihufxt.supabase.co";
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3amFvbHh0dnF3cmZvaWh1Znh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODE4MzEsImV4cCI6MjA4OTA1NzgzMX0.B7ssuHtnz3dQrInQZt8CTQFW1wbMjr8OM6xoCVJJEFk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
