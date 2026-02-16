"use client"

import { Check, Circle } from "lucide-react"

function calculatePasswordStrength(
  password: string
): "weak" | "medium" | "strong" {
  if (password.length < 8) return "weak"

  let strength = 0
  if (/[A-Z]/.test(password)) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  if (strength <= 2) return "weak"
  if (strength === 3) return "medium"
  return "strong"
}

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "One special character",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
]

export function PasswordStrengthIndicator({
  password,
}: {
  password: string
}) {
  const strength = calculatePasswordStrength(password)

  const strengthConfig = {
    weak: { color: "bg-red-500", text: "Weak", width: "w-1/3" },
    medium: { color: "bg-yellow-500", text: "Medium", width: "w-2/3" },
    strong: { color: "bg-green-500", text: "Strong", width: "w-full" },
  }

  const config = strengthConfig[strength]

  if (!password) return null

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="space-y-1.5">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${config.color} transition-all duration-300 ease-out ${config.width}`}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength:</span>
          <span
            className={`font-medium ${
              strength === "strong"
                ? "text-green-600"
                : strength === "medium"
                  ? "text-yellow-600"
                  : "text-red-600"
            }`}
          >
            {config.text}
          </span>
        </div>
      </div>
      <ul className="space-y-1" aria-label="Password requirements">
        {requirements.map((req) => {
          const met = req.test(password)
          return (
            <li
              key={req.label}
              className={`text-xs flex items-center gap-1.5 transition-colors ${
                met ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {met ? (
                <Check className="h-3 w-3 shrink-0" />
              ) : (
                <Circle className="h-3 w-3 shrink-0" />
              )}
              <span>{req.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
