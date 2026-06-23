let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    try {
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ypsplpqawhxqhowzzulw.supabase.co";
      const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "ypsplpqawhxqhowzzulw";
      const storageKey = `sb-${projectRef}-auth-token`;
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.access_token) {
          return parsed.access_token;
        }
      }
    } catch (e) {
      console.error("[api-fetch] localStorage token read error:", e);
    }
  }
  return _accessToken;
}

export function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
