import { BatteryCharging } from "lucide-react"

import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
  showWordmark?: boolean
  inverted?: boolean
}

export function BrandLogo({
  className,
  showWordmark = true,
  inverted = false,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-[oklch(0.42_0.12_50)] text-primary-foreground shadow-[0_8px_24px_oklch(0.52_0.13_55_/_0.28)]",
          inverted && "from-sidebar-primary to-[oklch(0.58_0.14_55)] text-sidebar-primary-foreground"
        )}
      >
        <BatteryCharging className="size-5" />
      </span>
      {showWordmark ? (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-heading text-[15px] font-semibold tracking-tight",
              inverted ? "text-sidebar-foreground" : "text-foreground"
            )}
          >
            VoltOps
          </span>
          <span
            className={cn(
              "text-[11px] tracking-[0.18em] uppercase",
              inverted ? "text-sidebar-foreground/55" : "text-muted-foreground"
            )}
          >
            Battery Sales
          </span>
        </span>
      ) : null}
    </div>
  )
}
