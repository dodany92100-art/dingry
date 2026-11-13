import type { User } from "@supabase/supabase-js";
import { isSupabaseStoreEnabled, supabaseAdmin } from "@/lib/supabase/server";

export function shopBearerAccessToken(request: Request): string | null {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function shopUserFromAccessToken(accessToken: string): Promise<User | null> {
  if (!isSupabaseStoreEnabled()) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(accessToken);
  if (error || !data.user) {
    if (error) console.error("[shop-auth] getUser", { message: error.message });
    return null;
  }
  return data.user;
}
