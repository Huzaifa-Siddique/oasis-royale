import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null | undefined;

const SUPABASE_URL = "https://ypsplpqawhxqhowzzulw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wxTzEjX3LCse2q-K_ta00w_NAyStvLq";

export function getSupabaseClient(): SupabaseClient | null {
	if (cachedClient !== undefined) {
		return cachedClient;
	}

	try {
		const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
		const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

		if (!url || !key) {
			cachedClient = null;
			return null;
		}

		cachedClient = createClient(url, key);
		return cachedClient;
	} catch (error) {
		console.error("Failed to initialize Supabase client:", error);
		cachedClient = null;
		return null;
	}
}

export function getSupabaseAuthClient(token: string): SupabaseClient {
	const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
	const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
	return createClient(url, key, {
		global: {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	});
}
