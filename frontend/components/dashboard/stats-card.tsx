import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

export function StatsCard({ title, icon: Icon, children, className }: StatsCardProps) {
  return (
    <Card className={cn("transition-colors duration-150 ease-in-out", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

interface StatusDotProps {
  status: "connected" | "disconnected"
}

export function StatusDot({ status }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        status === "connected" ? "bg-emerald-500" : "bg-red-500"
      )}
      aria-hidden="true"
    />
  )
}

interface ProgressBarProps {
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full rounded-full bg-secondary" role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-in-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}
