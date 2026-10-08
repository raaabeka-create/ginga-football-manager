const SUPABASE_URL = "https://fqwsffvwseepdtgmzvuz.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_pqAw1OWSGZ0bsV1WnlO7nQ_hiOyU94M";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
