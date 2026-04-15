import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

export function getBearerTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null

  const [scheme, token] = authHeader.split(" ")
  if (!scheme || !token) return null
  if (scheme.toLowerCase() !== "bearer") return null

  return token
}

export function createAuthedServerClient(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured")
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export async function getAuthenticatedUserId(request: Request) {
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

  return { userId: user.id, client }
}
