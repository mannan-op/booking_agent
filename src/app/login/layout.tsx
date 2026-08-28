import type { Metadata } from "next"
import type { ReactNode } from "react"

import { GuestGuard } from "@/components/layout/guest-guard"

export const metadata: Metadata = {
  title: "Sign in",
}

export default function LoginLayout({
  children,
}: {
  children: ReactNode
}) {
  return <GuestGuard>{children}</GuestGuard>
}
