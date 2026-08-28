"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, LogOut, Search, Settings, UserRound } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { setAuthenticated } from "@/lib/auth"
import { currentUser, notifications, searchSuggestions } from "@/lib/mock-data"

export function AppHeader() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const unreadCount = notifications.filter((item) => item.unread).length

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) {
      return searchSuggestions
    }

    return searchSuggestions.filter((item) =>
      item.label.toLowerCase().includes(value)
    )
  }, [query])

  function handleLogout() {
    setAuthenticated(false)
    router.replace("/login")
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="h-5" />
      <div className="hidden items-center gap-2 sm:flex">
        <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_oklch(0.72_0.16_155_/_0.7)]" />
        <span className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Lahore · Live
        </span>
      </div>
      <div className="relative hidden max-w-lg flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setSearchOpen(false), 120)
          }}
          placeholder="Search queries, orders, batteries…"
          className="h-10 rounded-full bg-card pl-9"
        />
        {searchOpen ? (
          <div className="absolute top-full z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-xl">
            {results.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No matching records.
              </p>
            ) : (
              results.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 text-sm hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))
            )}
          </div>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="relative" />
            }
          >
            <Bell className="size-4" />
            {unreadCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
            ) : null}
            <span className="sr-only">Notifications</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((item) => (
              <DropdownMenuItem key={item.id} className="flex flex-col items-start gap-0.5 py-2">
                <span className="flex w-full items-center justify-between">
                  <span className="font-medium">{item.title}</span>
                  {item.unread ? (
                    <span className="size-1.5 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
                <span className="text-[11px] text-muted-foreground">{item.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-10 gap-2 rounded-full px-2" />}
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-primary/15 text-primary">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-sm font-medium">{currentUser.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {currentUser.role}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{currentUser.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {currentUser.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/settings" />}>
                <UserRound />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings" />}>
                <Settings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
