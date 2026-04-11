import { supabaseServer } from "@/lib/supabaseServer"

export async function fetchVenues() {
  const { data, error } = await supabaseServer
    .from("venues")
    .select("*")

  if (error) throw error

  return data
}