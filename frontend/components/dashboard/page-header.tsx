import Link from "next/link"
import { LucideIcon, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface PageHeaderProps {
  readonly title: string
  readonly icon: LucideIcon
  readonly showBackButton?: boolean
  readonly backHref?: string
  readonly badge?: ReactNode
  readonly actions?: ReactNode
  readonly maxWidth?: "5xl" | "6xl"
}

export function PageHeader({
  title,
  icon: Icon,
  showBackButton = false,
  backHref = "/dashboard",
  badge,
  actions,
  maxWidth = "5xl",
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
      <div className={`mx-auto flex h-16 ${maxWidth === "6xl" ? "max-w-6xl" : "max-w-5xl"} items-center justify-between px-4 sm:px-6`}>
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {badge}
        </div>

        {actions && <div className="flex">{actions}</div>}
      </div>
    </header>
  )
}
