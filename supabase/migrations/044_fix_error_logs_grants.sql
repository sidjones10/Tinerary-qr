-- ============================================================================
-- Migration: Fix missing grants on error_logs table
-- ============================================================================
-- The error_logs table (from migration 032) was created with RLS policies but
-- without GRANT statements. PostgREST requires explicit grants to expose
-- tables to authenticated/anon roles in the schema cache.

-- Allow authenticated users to SELECT (admins only via RLS) and INSERT
GRANT SELECT, INSERT, UPDATE ON public.error_logs TO authenticated;

-- Allow anonymous users to INSERT error logs (client-side error reporting)
GRANT INSERT ON public.error_logs TO anon;

-- Grant execute on the log_error() helper function
GRANT EXECUTE ON FUNCTION public.log_error TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_error TO anon;
