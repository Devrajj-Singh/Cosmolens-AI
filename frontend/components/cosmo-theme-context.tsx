"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Theme } from "@/lib/themes"

export type ActiveModule = "explorer" | "planet-ai"

export type ExplorerAIStatus = "active" | "loading" | "offline" | "locked"
export type PlanetAIStatus = "ready" | "processing" | "loading" | "offline" | "locked"

interface CosmoThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  activeModule: ActiveModule
  setActiveModule: (module: ActiveModule) => void
  isTransitioning: boolean
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  explorerAIStatus: ExplorerAIStatus
  setExplorerAIStatus: (status: ExplorerAIStatus) => void
  planetAIStatus: PlanetAIStatus
  setPlanetAIStatus: (status: PlanetAIStatus) => void
}

const CosmoThemeContext = createContext<CosmoThemeContextType>({
  theme: "nebula",
  setTheme: () => {},
  activeModule: "explorer",
  setActiveModule: () => {},
  isTransitioning: false,
  isAuthenticated: true,
  setIsAuthenticated: () => {},
  explorerAIStatus: "active",
  setExplorerAIStatus: () => {},
  planetAIStatus: "ready",
  setPlanetAIStatus: () => {},
})

export function CosmoThemeProvider({
  children,
  initialModule = "explorer",
  initialAuth = true,
}: {
  children: ReactNode
  initialModule?: ActiveModule
  initialAuth?: boolean
}) {
  const [theme, setTheme] = useState<Theme>("nebula")
  const [activeModule, setActiveModuleRaw] = useState<ActiveModule>(initialModule)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth)
  const [explorerAIStatus, setExplorerAIStatus] = useState<ExplorerAIStatus>(initialAuth ? "active" : "locked")
  const [planetAIStatus, setPlanetAIStatus] = useState<PlanetAIStatus>(initialAuth ? "ready" : "locked")

  // ── Backend health check ─────────────────────────────────────────────────
  const checkBackend = useCallback(async () => {
    if (!initialAuth) return
    try {
      const res = await fetch("http://localhost:5000/api/planet/health", {
        signal: AbortSignal.timeout(3000),
      })
      setPlanetAIStatus(res.ok ? "ready" : "offline")
    } catch {
      setPlanetAIStatus("offline")
    }
  }, [initialAuth])

  useEffect(() => {
    checkBackend()
    const interval = setInterval(checkBackend, 30_000)
    return () => clearInterval(interval)
  }, [checkBackend])
  // ────────────────────────────────────────────────────────────────────────

  const setActiveModule = (module: ActiveModule) => {
    if (module === activeModule) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveModuleRaw(module)
      setTimeout(() => setIsTransitioning(false), 260)
    }, 20)
  }

  return (
    <CosmoThemeContext.Provider
      value={{
        theme,
        setTheme,
        activeModule,
        setActiveModule,
        isTransitioning,
        isAuthenticated,
        setIsAuthenticated,
        explorerAIStatus,
        setExplorerAIStatus,
        planetAIStatus,
        setPlanetAIStatus,
      }}
    >
      {children}
    </CosmoThemeContext.Provider>
  )
}

export function useCosmoTheme() {
  return useContext(CosmoThemeContext)
}