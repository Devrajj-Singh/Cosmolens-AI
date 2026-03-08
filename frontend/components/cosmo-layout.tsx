"use client"

import { useRef, useEffect, useState, type ReactNode } from "react"
import { CosmoThemeProvider, useCosmoTheme, type ActiveModule } from "@/components/cosmo-theme-context"
import { CosmoNavbar } from "@/components/cosmo-navbar"
import { CosmoBackground } from "@/components/cosmo-background"
import { themeStyles } from "@/lib/themes"

// ---------------------------------------------------------------------------
// Transition wrapper for each module panel
// ---------------------------------------------------------------------------

function ModulePanel({
  children,
  isActive,
  direction,
}: {
  children: ReactNode
  isActive: boolean
  direction: "left" | "right"
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<"enter" | "exit" | "idle">(isActive ? "idle" : "exit")

  useEffect(() => {
    if (isActive) {
      // Briefly set to "enter" then idle after animation completes
      setPhase("enter")
      const timer = setTimeout(() => setPhase("idle"), 260)
      return () => clearTimeout(timer)
    } else {
      setPhase("exit")
    }
  }, [isActive])

  // Compute transform and opacity based on phase and direction
  const getTransform = () => {
    if (phase === "exit") {
      return direction === "left" ? "translateX(-24px)" : "translateX(24px)"
    }
    if (phase === "enter") {
      return "translateX(0)"
    }
    return "translateX(0)"
  }

  const getOpacity = () => {
    return phase === "exit" ? 0 : 1
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-y-auto overflow-x-hidden will-change-transform"
      style={{
        transform: getTransform(),
        opacity: getOpacity(),
        transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: isActive ? "auto" : "none",
        visibility: phase === "exit" ? "hidden" : "visible",
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inner layout with transition engine
// ---------------------------------------------------------------------------

function CosmoLayoutInner({
  explorerContent,
  planetAIContent,
}: {
  explorerContent: ReactNode
  planetAIContent: ReactNode
}) {
  const { theme, activeModule } = useCosmoTheme()
  const styles = themeStyles[theme]

  return (
    <div className={`relative min-h-screen w-full ${styles.bg}`}>
      <CosmoBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navbar stays completely static during transition */}
        <CosmoNavbar />

        {/* Module transition container */}
        <main className="flex-1 relative overflow-hidden">
          <ModulePanel isActive={activeModule === "explorer"} direction="left">
            {explorerContent}
          </ModulePanel>
          <ModulePanel isActive={activeModule === "planet-ai"} direction="right">
            {planetAIContent}
          </ModulePanel>
        </main>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Public CosmoLayout
// ---------------------------------------------------------------------------

export function CosmoLayout({
  explorerContent,
  planetAIContent,
  initialModule = "explorer",
  initialAuth = true,
}: {
  explorerContent: ReactNode
  planetAIContent: ReactNode
  initialModule?: ActiveModule
  initialAuth?: boolean
}) {
  return (
    <CosmoThemeProvider initialModule={initialModule} initialAuth={initialAuth}>
      <CosmoLayoutInner
        explorerContent={explorerContent}
        planetAIContent={planetAIContent}
      />
    </CosmoThemeProvider>
  )
}
