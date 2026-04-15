"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabaseClient"

type SavedItem = {
  id: string
  item_id: string
  item_type: string
  name: string
  location: string
}

function getSavedTypeLabel(itemType: string) {
  return itemType === "organization" ? "Organization" : "Venue"
}

export default function ClientSavedContent() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadSavedItems() {
      setLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      const user = session?.user
      const token = session?.access_token

      if (!user || !token) {
        if (!active) return
        setSavedItems([])
        setAccessToken(null)
        setLoading(false)
        setError("Please log in to view saved items")
        return
      }

      setAccessToken(token)

      try {
        const response = await fetch("/api/client/saved", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to load saved items")
        }

        const data = (await response.json()) as SavedItem[]
        if (!active) return
        setSavedItems(data)
      } catch (fetchError: unknown) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load saved items")
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void loadSavedItems()

    return () => {
      active = false
    }
  }, [])

  async function handleRemove(savedItemId: string) {
    if (!accessToken) return

    setRemovingId(savedItemId)

    try {
      const response = await fetch(
        `/api/client/saved?savedItemId=${encodeURIComponent(savedItemId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to remove saved item")
      }

      setSavedItems((current) => current.filter((item) => item.id !== savedItemId))
    } catch (removeError: unknown) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove saved item")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-primary">Saved</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Saved Items</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Keep track of venues and organizations you want to revisit later.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading saved items...</p>
        )}

        {error && !loading && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && savedItems.length === 0 && (
          <p className="text-sm text-muted-foreground">You have no saved items yet.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {savedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {getSavedTypeLabel(item.item_type)}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{item.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.location}</p>

              <div className="mt-5 flex gap-3">
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href={item.item_type === "organization" ? `/organizations/${item.item_id}` : "/dashboard/client"}>
                    View
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => {
                    void handleRemove(item.id)
                  }}
                  disabled={removingId === item.id}
                >
                  {removingId === item.id ? "Removing..." : "Remove"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
