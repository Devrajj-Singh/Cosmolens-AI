"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import {
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  Palette,
  Home,
  LogOut,
  User,
  Search,
  Telescope,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCosmoTheme } from "@/components/cosmo-theme-context"
import { clearSession } from "@/lib/auth/session"
import { logoutUser } from "@/lib/firebase/auth"
import { themeStyles, themeOptions, type Theme } from "@/lib/themes"

const themeIcons: Record<Theme, typeof Sun> = {
  dark: Moon,
  nebula: Sparkles,
  light: Sun,
  spacePurple: Palette,
  pink: Palette,
}

// ---------------------------------------------------------------------------
// AI Status badge with per-module state and animated transitions
// ---------------------------------------------------------------------------

type StatusConfig = {
  dotColor: string
  glowColor: string
  label: string
  pulse: boolean
}

function getExplorerStatusConfig(status: string): StatusConfig {
  switch (status) {
    case "active":
      return { dotColor: "bg-blue-400", glowColor: "shadow-blue-400/50", label: "Explorer Module Active", pulse: false }
    case "loading":
      return { dotColor: "bg-yellow-400", glowColor: "shadow-yellow-400/50", label: "Initializing...", pulse: true }
    case "offline":
      return { dotColor: "bg-red-400", glowColor: "shadow-red-400/50", label: "AI Offline", pulse: false }
    case "locked":
      return { dotColor: "bg-gray-400", glowColor: "shadow-gray-400/30", label: "AI Locked", pulse: false }
    default:
      return { dotColor: "bg-gray-400", glowColor: "shadow-gray-400/30", label: "AI Locked", pulse: false }
  }
}

function getPlanetAIStatusConfig(status: string): StatusConfig {
  switch (status) {
    case "ready":
      return { dotColor: "bg-emerald-400", glowColor: "shadow-emerald-400/50", label: "Planet AI Model Ready", pulse: false }
    case "processing":
      return { dotColor: "bg-amber-400", glowColor: "shadow-amber-400/50", label: "Planet AI Processing\u2026", pulse: true }
    case "loading":
      return { dotColor: "bg-yellow-400", glowColor: "shadow-yellow-400/50", label: "Initializing...", pulse: true }
    case "offline":
      return { dotColor: "bg-red-400", glowColor: "shadow-red-400/50", label: "AI Offline", pulse: false }
    case "locked":
      return { dotColor: "bg-gray-400", glowColor: "shadow-gray-400/30", label: "AI Locked", pulse: false }
    default:
      return { dotColor: "bg-gray-400", glowColor: "shadow-gray-400/30", label: "AI Locked", pulse: false }
  }
}

function AIStatusBadge({
  activeModule,
  explorerAIStatus,
  planetAIStatus,
  styles,
}: {
  activeModule: string
  explorerAIStatus: string
  planetAIStatus: string
  theme: string
  styles: (typeof themeStyles)[keyof typeof themeStyles]
}) {
  const config = useMemo(() => {
    return activeModule === "explorer"
      ? getExplorerStatusConfig(explorerAIStatus)
      : getPlanetAIStatusConfig(planetAIStatus)
  }, [activeModule, explorerAIStatus, planetAIStatus])

  return (
    <div
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full ${styles.accentBg} transition-all duration-200`}
    >
      {/* Dot with glow */}
      <div className="relative flex items-center justify-center w-2 h-2">
        {/* Glow layer */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-200 ${config.dotColor} ${config.glowColor} ${config.pulse ? "animate-pulse" : ""}`}
          style={{ boxShadow: `0 0 6px 1px currentColor` }}
        />
        {/* Solid dot */}
        <div
          className={`relative w-2 h-2 rounded-full transition-colors duration-200 ${config.dotColor}`}
        />
      </div>
      {/* Label with crossfade */}
      <span className="relative text-sm font-medium hidden sm:inline overflow-hidden">
        <span
          className="inline-block transition-all duration-200 ease-in-out"
          style={{ opacity: 1 }}
          key={config.label}
        >
          {config.label}
        </span>
      </span>
    </div>
  )
}

export function CosmoNavbar() {
  const router = useRouter()
  const {
    theme,
    setTheme,
    activeModule,
    setActiveModule,
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    explorerAIStatus,
    explorerSearchTerm,
    setExplorerSearchTerm,
    explorerSearchHasError,
    setExplorerSearchHasError,
    submitExplorerSearch,
    planetAIStatus,
  } = useCosmoTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false)
  const themeDropdownRef = useRef<HTMLDivElement>(null)
  const themeButtonRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  const styles = themeStyles[theme]
  const guidanceSections = [
    {
      key: "explorer",
      title: "How to use Explorer AI",
      description: "Search a space object, then inspect the AI summary, live properties, timeline, and notes panel.",
      icon: Telescope,
      steps: ["Type an object name in search", "Press Search to load live data", "Open Timeline or Notes for extra context"],
    },
    {
      key: "planet-ai",
      title: "How to use Planet AI",
      description: "Tune the planetary sliders and run the habitability model to see classification, confidence, and key drivers.",
      icon: SlidersHorizontal,
      steps: ["Adjust planet, orbit, and star values", "Click Analyze Habitability", "Review the prediction and feature scores"],
    },
  ] as const
  const activeGuidance = guidanceSections.find((section) => section.key === activeModule) ?? guidanceSections[0]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (themeDropdownOpen && themeButtonRef.current) {
      const rect = themeButtonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [themeDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById("chat-sidebar")
      const menuButton = document.getElementById("menu-button")
      if (
        sidebarOpen &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        menuButton &&
        !menuButton.contains(e.target as Node)
      ) {
        setSidebarOpen(false)
      }
      if (
        themeDropdownOpen &&
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(e.target as Node) &&
        themeButtonRef.current &&
        !themeButtonRef.current.contains(e.target as Node)
      ) {
        setThemeDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [sidebarOpen, themeDropdownOpen])

  const handleLogout = async () => {
    await logoutUser()
    clearSession()
    setUser(null)
    setIsAuthenticated(false)
    setSidebarOpen(false)
    router.push("/")
  }

  const handleExplorerSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitExplorerSearch()
  }

  const ThemeDropdownPortal = () => {
    if (!mounted || !themeDropdownOpen) return null

    return createPortal(
      <div
        ref={themeDropdownRef}
        className="fixed w-44 rounded-lg border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          top: dropdownPosition.top,
          right: dropdownPosition.right,
          zIndex: 9999,
          backgroundColor:
            theme === "dark"
              ? "#101218"
              : theme === "light"
                ? "#ffffff"
                : theme === "spacePurple"
                  ? "rgba(74, 31, 111, 0.95)"
                  : "rgba(15, 23, 42, 0.95)",
          borderColor:
            theme === "dark"
              ? "#1a1c22"
              : theme === "light"
                ? "#e2e8f0"
                : theme === "spacePurple"
                  ? "rgba(139, 92, 246, 0.3)"
                  : "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
        }}
      >
        {themeOptions.map((option) => {
          const Icon = themeIcons[option.id]
          return (
            <button
              key={option.id}
              onClick={() => {
                setTheme(option.id)
                setThemeDropdownOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 first:rounded-t-lg last:rounded-b-lg ${
                theme === option.id ? styles.accentBg : `${styles.textSecondary} hover:bg-white/10`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{option.label}</span>
            </button>
          )
        })}
      </div>,
      document.body,
    )
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        id="chat-sidebar"
        className={`fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${styles.sidebarBg} border-r ${styles.sidebarBorder}`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Top: Header — fixed */}
          <div className="shrink-0 flex items-center justify-between mb-3">
            <h2 className={`text-lg font-semibold ${styles.textPrimary}`}>Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className={`${styles.textSecondary} hover:${styles.textPrimary} transition-all duration-200`}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className={`shrink-0 mb-3 pb-3 border-b ${theme === "light" ? "border-slate-200" : "border-white/10"}`}>
            <Button
              onClick={() => {
                setSidebarOpen(false)
                router.push("/home")
              }}
              className={`w-full justify-start ${styles.buttonBg} border ${styles.textPrimary} transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]`}
            >
              <Home className="w-4 h-4 mr-3" />
              Home
            </Button>
          </div>

          <div className="flex-1 flex items-center">
            <div
              className={`rounded-2xl border p-4 transition-all duration-200 ${styles.cardBg} shadow-lg ${
                theme === "light"
                  ? "border-cyan-300/70"
                  : theme === "dark"
                    ? "border-[#7c7cff]/40 shadow-[#7c7cff]/10"
                    : theme === "spacePurple"
                      ? "border-violet-400/40 shadow-violet-500/10"
                      : "border-cyan-400/30 shadow-cyan-500/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    theme === "light"
                      ? "bg-cyan-100 text-cyan-700"
                      : theme === "dark"
                        ? "bg-[#7c7cff]/15 text-[#a5a5ff]"
                        : theme === "spacePurple"
                          ? "bg-violet-500/15 text-violet-300"
                          : "bg-cyan-500/15 text-cyan-300"
                  }`}
                >
                  <activeGuidance.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${styles.textPrimary}`}>{activeGuidance.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles.accentBg}`}>
                      Active
                    </span>
                  </div>
                  <p className={`mt-1 text-xs leading-relaxed ${styles.textMuted}`}>{activeGuidance.description}</p>
                </div>
              </div>

              <div className={`mt-4 space-y-2 border-t pt-3 ${theme === "light" ? "border-slate-200" : "border-white/10"}`}>
                {activeGuidance.steps.map((step, index) => (
                  <div key={step} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${styles.accentBg}`}>
                      {index + 1}
                    </span>
                    <p className={`text-xs leading-relaxed ${styles.textSecondary}`}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profile + Logout — compact fixed bottom */}
          <div className={`shrink-0 mt-3 pt-3 border-t ${theme === "light" ? "border-slate-200" : "border-white/10"}`}>
            {isAuthenticated ? (
              <>
                {/* Compact User Profile */}
                <div
                  className={`group flex items-center gap-2.5 px-2 py-1.5 mb-2 rounded-lg transition-all duration-200 cursor-pointer hover:-translate-y-px ${
                    theme === "light"
                      ? "hover:bg-slate-100"
                      : theme === "dark"
                        ? "hover:bg-[#101218]/60"
                        : theme === "spacePurple"
                          ? "hover:bg-violet-800/30"
                          : "hover:bg-white/5"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-shadow duration-200 ${
                        theme === "light"
                          ? "bg-gradient-to-br from-cyan-100 to-blue-100 text-cyan-700 ring-1 ring-cyan-300/40 group-hover:ring-cyan-400/60"
                          : theme === "dark"
                            ? "bg-gradient-to-br from-[#1a1c22] to-[#101218] text-[#a5a5ff] ring-1 ring-[#7c7cff]/30 group-hover:ring-[#7c7cff]/50"
                            : theme === "spacePurple"
                              ? "bg-gradient-to-br from-violet-800/60 to-purple-900/60 text-violet-200 ring-1 ring-violet-400/30 group-hover:ring-violet-400/50"
                              : "bg-gradient-to-br from-slate-800/60 to-slate-900/60 text-cyan-200 ring-1 ring-cyan-400/30 group-hover:ring-cyan-400/50"
                      }`}
                    >
                      {(user?.email?.[0] ?? "U").toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-emerald-400 ${
                        theme === "light" ? "border-white" : theme === "dark" ? "border-[#0b0c10]" : "border-slate-900"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight truncate ${styles.textPrimary}`}>{user?.email ?? "Authenticated User"}</p>
                    <p className={`text-[11px] leading-tight truncate ${styles.textMuted}`}>{user?.provider ?? "Firebase Auth"}</p>
                  </div>
                </div>

                <div className={`mb-2 border-t ${theme === "light" ? "border-slate-200/60" : "border-white/5"}`} />

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className={`w-full justify-start h-9 text-sm ${styles.buttonBg} border text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 active:scale-[0.98]`}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Log Out
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2.5 px-2 py-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                    theme === "light"
                      ? "bg-slate-200 text-slate-500"
                      : theme === "dark"
                        ? "bg-[#1a1c22] text-white/40"
                        : theme === "spacePurple"
                          ? "bg-violet-800/50 text-violet-300/60"
                          : "bg-white/10 text-white/40"
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight truncate ${styles.textPrimary}`}>Guest User</p>
                  <p className={`text-[11px] leading-tight truncate ${styles.textMuted}`}>Limited Access</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Navbar - stays static during transition */}
      <header
        className={`h-16 px-4 flex items-center justify-between border-b transition-colors duration-300 ${
          theme === "light" ? "border-slate-200 bg-white" : "border-white/10"
        } ${theme === "nebula" ? "backdrop-blur-xl bg-black/30" : theme === "dark" ? "bg-[#0b0c10]" : theme === "spacePurple" ? "backdrop-blur-xl bg-purple-950/80" : ""}`}
      >
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-4">
          <Button
            id="menu-button"
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`${styles.textSecondary} transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95`}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <div
                className={`absolute inset-0 rounded-full ${theme === "spacePurple" ? "bg-gradient-to-br from-violet-400 to-blue-600" : theme === "dark" ? "bg-gradient-to-br from-[#7c7cff] to-blue-600" : "bg-gradient-to-br from-cyan-400 to-blue-600"}`}
              />
              <div
                className={`absolute inset-1 rounded-full flex items-center justify-center ${theme === "light" ? "bg-white" : theme === "dark" ? "bg-[#050507]" : "bg-slate-900"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${theme === "spacePurple" ? "bg-gradient-to-br from-violet-300 to-blue-400" : theme === "dark" ? "bg-gradient-to-br from-[#a5a5ff] to-blue-400" : "bg-gradient-to-br from-cyan-300 to-blue-400"}`}
                />
              </div>
            </div>
            <span className={`font-semibold ${styles.textPrimary} hidden sm:inline`}>CosmoLens AI</span>
          </div>
        </div>

          {/* Center: Search + Segmented Tab Control */}
          <div className="flex items-center gap-2">
          {activeModule === "explorer" && (
            <form onSubmit={handleExplorerSearchSubmit} className="hidden lg:flex items-center gap-2 mr-2">
              <div className="relative">
                <Search className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${styles.textMuted}`} />
                <Input
                  value={explorerSearchTerm}
                  onChange={(event) => {
                    setExplorerSearchTerm(event.target.value)
                    if (explorerSearchHasError) {
                      setExplorerSearchHasError(false)
                    }
                  }}
                  placeholder="Search space objects..."
                  className={`w-72 h-10 pl-9 ${styles.inputBg} ${explorerSearchHasError ? "border-red-400/50 focus-visible:ring-red-400/30" : ""}`}
                />
              </div>
              <Button
                type="submit"
                className={`${styles.buttonBg} border ${styles.textPrimary} transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]`}
              >
                Search
              </Button>
            </form>
          )}
          {/* Segmented Control */}
          <div
            className={`relative flex rounded-xl p-1 border transition-all duration-300 ${
              theme === "light"
                ? "bg-slate-200/80 border-slate-300"
                : theme === "dark"
                  ? "bg-[#0b0c10] border-[#1a1c22]"
                  : theme === "spacePurple"
                    ? "bg-violet-900/40 border-violet-500/30"
                    : "bg-white/5 border-white/10 backdrop-blur-xl"
            }`}
          >
            {/* Animated background pill */}
            <div
              className={`absolute top-1 bottom-1 rounded-lg transition-all duration-250 ease-in-out ${
                theme === "light"
                  ? "bg-white shadow-md"
                  : theme === "dark"
                    ? "bg-[#101218] shadow-lg shadow-[#7c7cff]/20"
                    : theme === "spacePurple"
                      ? "bg-violet-700/50 shadow-lg shadow-violet-500/30"
                      : "bg-white/10 shadow-lg shadow-cyan-500/20"
              }`}
              style={{
                width: "calc(50% - 4px)",
                left: activeModule === "explorer" ? "4px" : "calc(50%)",
              }}
            />
            {/* Glow ring on active */}
            <div
              className={`absolute top-1 bottom-1 rounded-lg transition-all duration-250 ease-in-out pointer-events-none ${
                theme === "light"
                  ? "ring-1 ring-cyan-400/30"
                  : theme === "dark"
                    ? "ring-1 ring-[#7c7cff]/40"
                    : theme === "spacePurple"
                      ? "ring-1 ring-violet-400/40"
                      : "ring-1 ring-cyan-400/30"
              }`}
              style={{
                width: "calc(50% - 4px)",
                left: activeModule === "explorer" ? "4px" : "calc(50%)",
              }}
            />
            <button
              onClick={() => setActiveModule("explorer")}
              className={`relative z-10 px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeModule === "explorer" ? styles.textPrimary : styles.textMuted
              }`}
            >
              Explorer
            </button>
            <button
              onClick={() => setActiveModule("planet-ai")}
              className={`relative z-10 px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeModule === "planet-ai" ? styles.textPrimary : styles.textMuted
              }`}
            >
              Planet AI
            </button>
          </div>
        </div>

        {/* Right: Theme + AI Active (always visible) */}
        <div className="flex items-center gap-3">
          <Button
            ref={themeButtonRef}
            variant="ghost"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className={`${styles.buttonBg} border gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]`}
          >
            <Sparkles className="w-4 h-4" />
            <span className={`text-sm ${styles.textPrimary} hidden sm:inline`}>
              {themeOptions.find((t) => t.id === theme)?.label}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${themeDropdownOpen ? "rotate-180" : ""}`}
            />
          </Button>
          <ThemeDropdownPortal />
          <AIStatusBadge
            activeModule={activeModule}
            explorerAIStatus={explorerAIStatus}
            planetAIStatus={planetAIStatus}
            theme={theme}
            styles={styles}
          />
        </div>
      </header>
    </>
  )
}
