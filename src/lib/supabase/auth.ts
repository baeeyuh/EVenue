import { supabaseClient } from "../supabaseClient"

const supabase = supabaseClient

type SignUpParams = {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: "client" | "owner"
  businessName?: string
  contactNumber?: string
  businessAddress?: string
  city?: string
  province?: string
}

export async function signUp({
  email,
  password,
  firstName,
  lastName,
  role,
  businessName,
  contactNumber,
  businessAddress,
  city,
  province,
}: SignUpParams) {
  const getStatusCode = (error: unknown): number | undefined => {
    if (!error || typeof error !== "object") return undefined
    const candidate = error as { status?: number; statusCode?: number }
    return candidate.status ?? candidate.statusCode
  }

  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
          business_name: businessName,
          contact_number: contactNumber,
          business_address: businessAddress,
          city,
          province,
        },
      },
    })

    if (!error) return { data, error: null }

    const status = getStatusCode(error)
    if (status === 429 && attempt < maxAttempts) {
      const backoff = 500 * Math.pow(2, attempt - 1)
      await new Promise((res) => setTimeout(res, backoff))
      continue
    }

    return { data, error }
  }

  return { data: null, error: new Error("Exceeded retry attempts") }
}

export async function signIn({ email, password }: { email: string; password: string }) {
  const getStatusCode = (error: unknown): number | undefined => {
    if (!error || typeof error !== "object") return undefined
    const candidate = error as { status?: number; statusCode?: number }
    return candidate.status ?? candidate.statusCode
  }

  const maxAttempts = 2

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return { data, error: null }

    const status = getStatusCode(error)
    if (status === 429 && attempt < maxAttempts) {
      const backoff = 300 * Math.pow(2, attempt - 1)
      await new Promise((res) => setTimeout(res, backoff))
      continue
    }

    return { data, error }
  }

  return { data: null, error: new Error("Exceeded retry attempts") }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}
