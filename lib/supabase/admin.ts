import { createClient } from '@supabase/supabase-js';

// DANGER: this client uses the service role key, which bypasses all
// Row Level Security policies. Never import this into any file that
// runs in the browser, and never use it to handle a normal user request.
// Only use this for trusted server-side jobs (e.g. the picks cron job)
// where there is no logged-in user to act on behalf of.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}