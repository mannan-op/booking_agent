"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  SESSION_HOURS,
  isValidEmail,
  signIn,
} from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authorized, setAuthorized] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
    authorized?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function attemptLogin(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setFieldErrors({})

    if (!authorized) {
      setFieldErrors({
        authorized: "Confirm you are an authorized operator before signing in.",
      })
      return
    }

    const result = signIn(email, password)
    if (!result.ok) {
      setFieldErrors({ [result.field ?? "password"]: result.message })
      return
    }

    setIsSubmitting(true)
    router.push("/dashboard")
  }

  return (
    <div className="relative grid min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-card lg:flex lg:flex-col lg:justify-between px-12 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,oklch(0.78_0.08_72_/_0.28),transparent_46%),radial-gradient(circle_at_80%_90%,oklch(0.94_0.03_85_/_0.9),transparent_52%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(oklch(0.52_0.13_55_/_0.06)_1px,transparent_1px),linear-gradient(90deg,oklch(0.52_0.13_55_/_0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
        <BrandLogo className="relative" />
        <div className="relative max-w-lg space-y-6">
          <p className="text-xs font-medium tracking-[0.28em] text-primary uppercase">
            Operations console
          </p>
          <h1 className="font-heading text-5xl leading-[1.05] font-semibold tracking-tight text-balance">
            The quiet luxury of a battery desk that never sleeps.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            VoltOps orchestrates customer intake, inventory truth, and fulfillment
            across Lahore branches — with human review only when the model is unsure.
          </p>
          <dl className="grid grid-cols-3 gap-6 pt-4">
            <div>
              <dt className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Branches
              </dt>
              <dd className="font-heading mt-1 text-2xl font-semibold">4</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                SKUs
              </dt>
              <dd className="font-heading mt-1 text-2xl font-semibold">25</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Session
              </dt>
              <dd className="font-heading mt-1 text-2xl font-semibold">{SESSION_HOURS}h</dd>
            </div>
          </dl>
        </div>
        <p className="relative text-xs text-muted-foreground">
          Restricted workspace · Demo credentials are provisioned for operators only.
        </p>
      </aside>

      <main className="relative flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">
            <BrandLogo />
          </div>
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            Sign in
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your provisioned VoltOps email. Sessions expire after {SESSION_HOURS} hours.
          </p>

          <form className="mt-8 space-y-5" onSubmit={attemptLogin} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                aria-invalid={Boolean(fieldErrors.email)}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setFieldErrors((current) => ({ ...current, email: undefined }))
                }}
                placeholder="nina.v@example.com"
                className="h-11 bg-background"
              />
              {fieldErrors.email ? (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <ForgotPasswordLink />
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={Boolean(fieldErrors.password)}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setFieldErrors((current) => ({ ...current, password: undefined }))
                  }}
                  placeholder="Enter your password"
                  className="h-11 bg-background pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>
              {fieldErrors.password ? (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              ) : null}
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm">
              <Checkbox
                checked={authorized}
                aria-invalid={Boolean(fieldErrors.authorized)}
                onCheckedChange={(checked) => {
                  setAuthorized(checked === true)
                  setFieldErrors((current) => ({ ...current, authorized: undefined }))
                }}
                className="mt-0.5"
              />
              <span>
                I confirm I am an authorized VoltOps operator and this is a controlled demo session.
                {fieldErrors.authorized ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {fieldErrors.authorized}
                  </span>
                ) : null}
              </span>
            </label>

            <button
              type="button"
              data-testid="login-submit"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 w-full shadow-[0_12px_32px_-16px_oklch(0.52_0.13_55_/_0.55)]",
              )}
              disabled={isSubmitting}
              onClick={() => attemptLogin()}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              {isSubmitting ? "Signing in…" : "Enter workspace"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-primary/15 bg-primary/6 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            Demo access:{" "}
            <span className="font-medium text-foreground">{DEMO_EMAIL}</span>
            {" · "}
            password{" "}
            <span className="font-medium text-foreground">{DEMO_PASSWORD}</span>
          </div>
        </div>
      </main>
    </div>
  )
}

function ForgotPasswordLink() {
  const [resetEmail, setResetEmail] = useState("")
  const [resetError, setResetError] = useState("")
  const [resetSent, setResetSent] = useState(false)

  function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = resetEmail.trim().toLowerCase()
    if (!value) {
      setResetError("Email is required.")
      return
    }
    if (!isValidEmail(value)) {
      setResetError("Enter a valid email address.")
      return
    }
    if (value !== DEMO_EMAIL) {
      setResetError("No VoltOps account is provisioned for this email.")
      return
    }
    setResetError("")
    setResetSent(true)
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setResetSent(false)
          setResetError("")
        }
      }}
    >
      <DialogTrigger
        render={<Button type="button" variant="link" className="h-auto px-0 text-xs" />}
      >
        Forgot password?
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Password resets are queued only for provisioned operator emails.
          </DialogDescription>
        </DialogHeader>
        {resetSent ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            If an account exists for {resetEmail}, a reset link has been queued.
          </p>
        ) : (
          <form className="space-y-3" onSubmit={handleReset}>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                aria-invalid={Boolean(resetError)}
                onChange={(event) => {
                  setResetEmail(event.target.value)
                  setResetError("")
                }}
                placeholder="nina.v@example.com"
              />
              {resetError ? <p className="text-xs text-destructive">{resetError}</p> : null}
            </div>
            <DialogFooter>
              <Button type="submit">Send reset link</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
