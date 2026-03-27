"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { syncBackendSession } from "@/lib/api/auth"
import { clearSession, getStoredUser, saveSession, type SessionUser } from "@/lib/auth/session"
import { subscribeToAuthState } from "@/lib/firebase/auth"
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
  authReady: boolean
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  user: SessionUser | null
  setUser: (user: SessionUser | null) => void
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
  authReady: false,
  isAuthenticated: true,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
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
  const [authReady, setAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [explorerAIStatus, setExplorerAIStatus] = useState<ExplorerAIStatus>(initialAuth ? "active" : "locked")
  const [planetAIStatus, setPlanetAIStatus] = useState<PlanetAIStatus>(initialAuth ? "ready" : "locked")

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  useEffect(() => {
    return subscribeToAuthState(async (firebaseUser) => {
      const authenticated = Boolean(firebaseUser)
      setAuthReady(true)
      setIsAuthenticated(authenticated)
      setExplorerAIStatus(authenticated ? "active" : "locked")
      setPlanetAIStatus(authenticated ? "ready" : "locked")
      if (!firebaseUser) {
        clearSession()
        setUser(null)
        return
      }

      try {
        const idToken = await firebaseUser.getIdToken()
        const session = await syncBackendSession(idToken)
        saveSession(session)
        setUser(session.user)
      } catch {
        clearSession()
        setUser(null)
      }
    })
  }, [])

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
      value={{ theme, setTheme, activeModule, setActiveModule, isTransitioning, authReady, isAuthenticated, setIsAuthenticated, user, setUser, explorerAIStatus, setExplorerAIStatus, planetAIStatus, setPlanetAIStatus }}
    >
      {children}
    </CosmoThemeContext.Provider>
  )
}

export function useCosmoTheme() {
  return useContext(CosmoThemeContext)
}
