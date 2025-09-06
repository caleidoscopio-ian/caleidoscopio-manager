"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { MobileSidebar } from "./mobile-sidebar"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      {isMobile ? <MobileSidebar /> : <Sidebar />}
      <main className={cn("flex-1 overflow-hidden", className)}>
        <div className={cn("h-full overflow-auto", isMobile && "pt-14")}>
          {children}
        </div>
      </main>
    </div>
  )
}