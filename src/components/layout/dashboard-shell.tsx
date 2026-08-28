import type { ReactNode } from "react"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AuthGuard } from "@/components/layout/auth-guard"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <AppHeader />
          <div className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
