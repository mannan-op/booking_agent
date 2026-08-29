"use client"

import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/page-header"
import { PageSkeleton } from "@/components/shared/table-skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useSimulatedLoading } from "@/hooks/use-simulated-loading"
import { currentUser } from "@/lib/mock-data"

export default function SettingsPage() {
  const isLoading = useSimulatedLoading(400)
  const [name, setName] = useState(currentUser.name)
  const [email, setEmail] = useState(currentUser.email)
  const [role, setRole] = useState(currentUser.role)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [reviewAlerts, setReviewAlerts] = useState(true)
  const [stockAlerts, setStockAlerts] = useState(true)
  const [digest, setDigest] = useState(false)
  const [compactTables, setCompactTables] = useState(false)
  const [autoAssign, setAutoAssign] = useState(true)
  const [branch, setBranch] = useState("Downtown Hub")
  const [timezone, setTimezone] = useState("Asia/Karachi")

  if (isLoading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, notification rules, and workspace preferences."
      />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">User profile</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                These details appear in the operations console and audit trail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {currentUser.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={role} onChange={(event) => setRole(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={(value) => value && setTimezone(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Karachi">Pakistan Standard Time</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Working notes</Label>
                  <Textarea
                    id="bio"
                    defaultValue="Owns query-to-order conversion for premium laptop battery SKUs."
                  />
                </div>
              </div>
              <Button
                onClick={() => toast.success("Profile settings saved")}
              >
                Save profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp via Cloud API (Meta)</CardTitle>
              <CardDescription>
                Customer chat lives on WhatsApp. Put the Meta Cloud API credentials in `.env.local`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Required: <span className="font-medium text-foreground">WHATSAPP_ACCESS_TOKEN</span>,{" "}
                <span className="font-medium text-foreground">WHATSAPP_PHONE_NUMBER_ID</span>,{" "}
                <span className="font-medium text-foreground">WHATSAPP_APP_SECRET</span> and{" "}
                <span className="font-medium text-foreground">WHATSAPP_VERIFY_TOKEN</span>, plus a public{" "}
                <span className="font-medium text-foreground">PUBLIC_APP_URL</span>.
              </p>
              <p>
                Meta webhook URL is <span className="font-medium text-foreground">/api/whatsapp/webhook</span>{" "}
                (subscribe to the <span className="font-medium text-foreground">messages</span> field). Inbound
                threads show up under Customer Queries. Cloud API replies within the 24-hour customer-service
                window automatically.
              </p>
              <p>
                Legacy WaAPI (QR scan) is also supported — add <span className="font-medium text-foreground">WAAPI_TOKEN</span>,{" "}
                <span className="font-medium text-foreground">WAAPI_INSTANCE_ID</span> and{" "}
                <span className="font-medium text-foreground">WAAPI_WEBHOOK_SECRET</span> instead.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification settings</CardTitle>
              <CardDescription>
                Choose how VoltOps alerts you about reviews, stock, and orders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <NotificationRow
                title="Email alerts"
                description="Receive important workspace events in your inbox."
                checked={emailAlerts}
                onCheckedChange={setEmailAlerts}
              />
              <NotificationRow
                title="Human review queue"
                description="Notify when AI confidence falls below the review threshold."
                checked={reviewAlerts}
                onCheckedChange={setReviewAlerts}
              />
              <NotificationRow
                title="Low stock warnings"
                description="Alert when a battery SKU drops below the reorder point."
                checked={stockAlerts}
                onCheckedChange={setStockAlerts}
              />
              <NotificationRow
                title="Daily operations digest"
                description="Summary of queries, orders, and inventory movement."
                checked={digest}
                onCheckedChange={setDigest}
              />
              <Button onClick={() => toast.success("Notification preferences updated")}>
                Save notifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System preferences</CardTitle>
              <CardDescription>
                Configure default branch, table density, and automation behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default branch</Label>
                  <Select value={branch} onValueChange={(value) => value && setBranch(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Downtown Hub">Downtown Hub</SelectItem>
                      <SelectItem value="North Warehouse">North Warehouse</SelectItem>
                      <SelectItem value="Airport Branch">Airport Branch</SelectItem>
                      <SelectItem value="West Outlet">West Outlet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <NotificationRow
                title="Compact tables"
                description="Show denser rows on queries, orders, and inventory screens."
                checked={compactTables}
                onCheckedChange={setCompactTables}
              />
              <NotificationRow
                title="Auto-assign reviews"
                description="Route low-confidence queries to the on-duty operations manager."
                checked={autoAssign}
                onCheckedChange={setAutoAssign}
              />
              <Button onClick={() => toast.success("System preferences saved")}>
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
