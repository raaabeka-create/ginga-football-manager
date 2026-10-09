const SUPABASE_URL = "https://fqwsffvwseepdtgmzvuz.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_pqAw1OWSGZ0bsV1WnlO7nQ_hiOyU94M";

// Expose the client for the separate browser scripts used by Ginga FM.
window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
