import { createClient } from "@supabase/supabase-js";

function readEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export function createSupabaseServerClient() {
    const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
    const key = readEnv("SUPABASE_SECRET_KEY");

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
