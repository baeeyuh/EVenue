import type { SupabaseClient } from "@supabase/supabase-js"
import { createAuthedServerClient, getBearerTokenFromRequest } from "@/lib/services/client/auth"

export async function getAuthenticatedOwner(request: Request): Promise<{
  userId: string | null
  client: SupabaseClient | null
}> {
  const token = getBearerTokenFromRequest(request)

  if (!token) {
    return { userId: null, client: null }
  }

  const client = createAuthedServerClient(token)

  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) {
    return { userId: null, client: null }
  }

  let role = user.user_metadata?.role as string | null | undefined

  if (!role) {
    const profileLookup = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileLookup.error) {
      return { userId: null, client: null }
    }

    role = (profileLookup.data as { role?: string | null } | null)?.role
  }

  const normalizedRole = role === "buyer" ? "client" : role

  if (normalizedRole !== "owner") {
    return { userId: null, client: null }
  }

  return {
    userId: user.id,
    client,
  }
}