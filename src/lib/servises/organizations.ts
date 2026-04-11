import { supabaseServer } from "@/lib/supabaseServer"   

export async function fetchOrganizations() {
  const { data, error } = await supabaseServer
  .from("organizations")
  .select("*")

  if (error) throw error

  return data
}