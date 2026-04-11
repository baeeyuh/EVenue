import { supabase } from "../supabaseClient"

type SignUpParams = {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export async function signUp({ email, password, firstName, lastName }: SignUpParams) {
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    })

    if (!error) return { data, error: null }

    const status = (error as any)?.status ?? (error as any)?.statusCode
    if (status === 429 && attempt < maxAttempts) {
      const backoff = 500 * Math.pow(2, attempt - 1)
      await new Promise((res) => setTimeout(res, backoff))
      continue
    }

    return { data, error }
  }

  return { data: null, error: { message: "Exceeded retry attempts" } as any }
}

export async function signIn({ email, password }: { email: string; password: string }) {
  const maxAttempts = 2

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return { data, error: null }

    const status = (error as any)?.status ?? (error as any)?.statusCode
    if (status === 429 && attempt < maxAttempts) {
      const backoff = 300 * Math.pow(2, attempt - 1)
      await new Promise((res) => setTimeout(res, backoff))
      continue
    }

    return { data, error }
  }

  return { data: null, error: { message: "Exceeded retry attempts" } as any }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}
