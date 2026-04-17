import type { SupabaseClient } from "@supabase/supabase-js"
import { supabaseServer } from "@/lib/supabaseServer"

export async function getAuthenticatedOwner(request: Request): Promise<{
  userId: string | null
  client: SupabaseClient | null
}> {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace(/^Bearer\s+/i, "")

  if (!token) {
    return { userId: null, client: null }
  }

  const {
    data: { user },
    error,
  } = await supabaseServer.auth.getUser(token)

  if (error || !user) {
    return { userId: null, client: null }
  }

  const role = user.user_metadata?.role
  const normalizedRole = role === "buyer" ? "client" : role

  if (normalizedRole !== "owner") {
    return { userId: null, client: null }
  }

  return {
    userId: user.id,
    client: supabaseServer,
  }
}