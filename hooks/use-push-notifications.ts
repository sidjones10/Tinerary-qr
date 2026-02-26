"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Convert a base64 VAPID public key to the Uint8Array format
 * required by the PushManager subscribe API.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [loading, setLoading] = useState(false)

  // Check browser support and current subscription state on mount
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window

    setIsSupported(supported)

    if (!supported) return

    setPermission(Notification.permission)

    // Check if already subscribed
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set")
      return false
    }

    setLoading(true)
    try {
      // Request notification permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== "granted") {
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (!response.ok) {
        throw new Error("Failed to save subscription on server")
      }

      setIsSubscribed(true)
      return true
    } catch (error) {
      console.error("[push] Subscribe error:", error)
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Remove from server
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        // Unsubscribe locally
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      return true
    } catch (error) {
      console.error("[push] Unsubscribe error:", error)
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported])

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  }
}
