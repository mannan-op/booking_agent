"use client"

import type { ReactNode } from "react"
import { useEffect, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"

import { AUTH_EVENT, isAuthenticated } from "@/lib/auth"

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(AUTH_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(AUTH_EVENT, callback)
  }
}

function getSnapshot() {
  return isAuthenticated()
}

function getServerSnapshot() {
  return false
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const authed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (authed) {
      router.replace("/dashboard")
    }
  }, [authed, router])

  if (authed) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Opening workspace…
      </div>
    )
  }

  return children
}
