export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left branding panel - hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
              <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
              <path d="M12 18a4.5 4.5 0 0 0 0-9" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">Personal Vault</span>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed text-primary-foreground/90">
              &ldquo;Personal Vault has completely changed how I organize my thoughts and ideas.
              Everything I need is in one place, secure and always accessible.&rdquo;
            </p>
            <footer className="text-sm text-primary-foreground/70">
              &mdash; Alex Chen, Product Designer
            </footer>
          </blockquote>
        </div>

        <p className="text-xs text-primary-foreground/50">
          &copy; 2026 Personal Vault. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 md:p-10">
        {children}
      </div>
    </div>
  )
}
