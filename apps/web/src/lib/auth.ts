import { createClient } from "@/lib/supabase/server";
import { getUserBySupabaseId, createUser } from "@/lib/services/user";
import type { User } from "@supabase/supabase-js";
import type { User as DbUser } from "@prisma/client";

interface AuthResult {
  authUser: User;
  dbUser: DbUser;
}

export async function requireAuth(): Promise<AuthResult | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const existing = await getUserBySupabaseId(user.id);

  if (existing) {
    return { authUser: user, dbUser: existing as DbUser };
  }

  const created = await createUser({
    supabaseId: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.full_name || null,
  });

  if (!created) {
    return null;
  }

  return { authUser: user, dbUser: created };
}
