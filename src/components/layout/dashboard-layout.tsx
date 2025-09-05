"use client"

import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className={cn("flex-1 overflow-hidden", className)}>
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}