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

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Customer Queries", href: "/queries", icon: MessageSquareText, badge: 18 },
  { title: "Live Chat", href: "/chat", icon: MessageSquareText },
  { title: "Human Review", href: "/review", icon: ClipboardCheck, badge: 3 },
  { title: "Orders", href: "/orders", icon: ShoppingCart },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
]
