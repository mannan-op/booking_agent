import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquareText,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Commerce",
    items: [
      { title: "Customer Queries", href: "/queries", icon: MessageSquareText },
      { title: "Human Review", href: "/review", icon: ClipboardCheck },
      { title: "Orders", href: "/orders", icon: ShoppingCart },
      { title: "Inventory", href: "/inventory", icon: Package },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
]

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items)
