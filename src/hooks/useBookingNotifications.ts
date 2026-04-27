"use client"

import { useEffect, useState } from "react"

import { supabaseClient } from "@/lib/supabaseClient"
import {
  getDueFollowUpNotifications,
  type BookingFollowUpSource,
  type BookingNotificationItem,
} from "@/lib/booking-followups"

type Role = "client" | "owner"

type BookingNotificationsState = {
  dueCount: number
  dueItems: BookingNotificationItem[]
  loading: boolean
  error: string | null
}

export function useBookingNotifications(
  role: Role,
  enabled: boolean
): BookingNotificationsState {
  const [state, setState] = useState<BookingNotificationsState>({
    dueCount: 0,
    dueItems: [],
    loading: enabled,
    error: null,
  })

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      if (!enabled) {
        if (!active) return
        setState({ dueCount: 0, dueItems: [], loading: false, error: null })
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        const accessToken = session?.access_token

        if (!accessToken) {
          throw new Error("Please log in to view notifications")
        }

        const endpoint = role === "owner" ? "/api/owner/bookings" : "/api/client/bookings"

        const response = await fetch(endpoint, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const data = (await response.json()) as BookingFollowUpSource[] & { message?: string }

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load notifications")
        }

  const dueItems = getDueFollowUpNotifications(data, { audience: role })

        if (!active) return
        setState({
          dueCount: dueItems.length,
          dueItems,
          loading: false,
          error: null,
        })
      } catch (error: unknown) {
        if (!active) return
        setState({
          dueCount: 0,
          dueItems: [],
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load notifications",
        })
      }
    }

    void loadNotifications()

    return () => {
      active = false
    }
  }, [enabled, role])

  return state
}