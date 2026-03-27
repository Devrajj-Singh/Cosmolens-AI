"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCosmoTheme } from "@/components/cosmo-theme-context"
import { themeStyles } from "@/lib/themes"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Sparkles, Lock, ChevronDown } from "lucide-react"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:18010"

// ---------------------------------------------------------------------------
// Backend health check hook
// ---------------------------------------------------------------------------

type BackendStatus = "checking" | "online" | "offline"

function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>("checking")

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      })
      setStatus(res.ok ? "online" : "offline")
    } catch {
      setStatus("offline")
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [check])

  return status
}

// ---------------------------------------------------------------------------
// Slider parameter definitions grouped by section
// ---------------------------------------------------------------------------

interface SliderParam {
  key: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit: string
}

const planetParams: SliderParam[] = [
  { key: "planet_mass", label: "Planet Mass", min: 0.1, max: 50, step: 0.1, defaultValue: 1, unit: "Earth masses" },
  { key: "planet_radius", label: "Planet Radius", min: 0.1, max: 25, step: 0.1, defaultValue: 1, unit: "Earth radii" },
  { key: "equilibrium_temperature", label: "Equilibrium Temperature", min: 50, max: 1000, step: 5, defaultValue: 255, unit: "K" },
  { key: "stellar_flux", label: "Stellar Flux", min: 0.01, max: 10, step: 0.01, defaultValue: 1, unit: "S/S☉" },
]

const orbitalParams: SliderParam[] = [
  { key: "semi_major_axis", label: "Semi-Major Axis", min: 0.01, max: 100, step: 0.01, defaultValue: 1, unit: "AU" },
  { key: "orbital_period", label: "Orbital Period", min: 1, max: 10000, step: 1, defaultValue: 365, unit: "days" },
]

const starParams: SliderParam[] = [
  { key: "star_temperature", label: "Star Temperature", min: 2000, max: 40000, step: 100, defaultValue: 5778, unit: "K" },
]

const allParams = [...planetParams, ...orbitalParams, ...starParams]

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

type PredictionClass = "habitable" | "potentially-habitable" | "non-habitable"

interface PredictionResult {
  classification: PredictionClass
  probabilities: { habitable: number; potential: number; nonHabitable: number }
  topFeatures: { label: string; importance: number }[]
  confidence: number
}

async function fetchPrediction(values: Record<string, number>): Promise<PredictionResult> {
  const response = await fetch(`${backendUrl}/api/planet/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mass: values.planet_mass,
      radius: values.planet_radius,
      temperature: values.equilibrium_temperature,
      pressure: 1,
      greenhouse: 0.3,
      semi_major_axis: values.semi_major_axis,
      orbital_period: values.orbital_period,
      stellar_flux: values.stellar_flux,
      star_temp: values.star_temperature,
      star_luminosity: 1,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || "Prediction failed")
  }

  const data = await response.json()
  const result = data.prediction
  const probabilities = result.probabilities

  return {
    classification: result.classification,
    probabilities: {
      habitable: probabilities.habitable,
      potential: probabilities.potential,
      nonHabitable: probabilities.non_habitable,
    },
    topFeatures: result.top_features,
    confidence: result.confidence ?? result.score ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Derived physical metrics
// ---------------------------------------------------------------------------

interface DerivedMetrics {
  surfaceGravity: number
  escapeVelocity: number
  atmosphereRetention: number
  habitableZone: "Inside" | "Outside"
  temperatureStability: number
}

function computeDerivedMetrics(values: Record<string, number>): DerivedMetrics {
  const mass = values.planet_mass
  const radius = values.planet_radius
  const surfaceGravity = mass / (radius * radius)
  const escapeVelocity = Math.sqrt(mass / radius) * 11.2
  const gravityFactor = Math.min(surfaceGravity / 0.5, 1)
  const tempFactor = values.equilibrium_temperature < 500 ? 1 : values.equilibrium_temperature < 800 ? 0.5 : 0.1
  const stellarFlux = values.stellar_flux ?? 1
  const atmosphereRetention = Math.round(Math.min(1, gravityFactor * tempFactor) * 100)
  const habitableZone: "Inside" | "Outside" = stellarFlux >= 0.2 && stellarFlux <= 2.0 ? "Inside" : "Outside"
  const tempDev = Math.abs(values.equilibrium_temperature - 255) / 255
  const temperatureStability = Math.round(Math.max(0, 1 - tempDev * 0.8) * 100)
  return { surfaceGravity, escapeVelocity, atmosphereRetention, habitableZone, temperatureStability }
}

// ---------------------------------------------------------------------------
// Canvas-rendered 3D planet preview
// ---------------------------------------------------------------------------

function Planet3D({ classification, theme }: { classification: PredictionClass; theme: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const getColors = useCallback(() => {
    if (classification === "habitable") return { primary: "#22c55e", secondary: "#3b82f6", glow: "rgba(34,197,94,0.35)", speed: 0.005 }
    if (classification === "potentially-habitable") return { primary: "#a3a3a3", secondary: "#6b7280", glow: "rgba(163,163,163,0.15)", speed: 0.008 }
    return { primary: "#6b3a3a", secondary: "#3b1515", glow: "rgba(239,68,68,0.2)", speed: 0 }
  }, [classification])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = 160
    canvas.width = size * 2
    canvas.height = size * 2
    ctx.scale(2, 2)

    let rotation = 0

    const draw = () => {
      const colors = getColors()
      ctx.clearRect(0, 0, size, size)
      const cx = size / 2
      const cy = size / 2
      const r = size * 0.3
      const glowGrad = ctx.createRadialGradient(cx, cy, r, cx, cy, r * 1.8)
      glowGrad.addColorStop(0, colors.glow)
      glowGrad.addColorStop(1, "transparent")
      ctx.fillStyle = glowGrad
      ctx.fillRect(0, 0, size, size)
      if (classification === "non-habitable") ctx.filter = "blur(3px)"
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      const bodyGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
      bodyGrad.addColorStop(0, colors.primary)
      bodyGrad.addColorStop(0.7, colors.secondary)
      bodyGrad.addColorStop(1, "#111")
      ctx.fillStyle = bodyGrad
      ctx.fillRect(0, 0, size, size)
      for (let i = -3; i <= 3; i++) {
        const bandY = cy + i * (r * 0.2)
        const bandWidth = Math.sqrt(Math.max(0, r * r - (bandY - cy) * (bandY - cy))) * 2
        if (bandWidth <= 0) continue
        ctx.globalAlpha = 0.15 + Math.sin(rotation + i) * 0.08
        ctx.fillStyle = i % 2 === 0 ? colors.primary : colors.secondary
        ctx.fillRect(cx - bandWidth / 2 + Math.sin(rotation * 0.5 + i) * 3, bandY - 2, bandWidth, 4)
      }
      ctx.globalAlpha = 1
      ctx.restore()
      ctx.filter = "none"
      ctx.beginPath()
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2)
      ctx.strokeStyle = classification === "habitable" ? "#22c55e" : classification === "potentially-habitable" ? "#9ca3af" : "#ef4444"
      ctx.globalAlpha = classification === "habitable" ? 0.5 : 0.2
      ctx.lineWidth = classification === "habitable" ? 3 : 2
      ctx.stroke()
      ctx.globalAlpha = 1
      rotation += colors.speed
      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [classification, theme, getColors])

  return <canvas ref={canvasRef} className="w-[160px] h-[160px]" style={{ imageRendering: "auto" }} />
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PlanetAIContent() {
  const { theme, isAuthenticated, setPlanetAIStatus, planetAIStatus } = useCosmoTheme()
  const router = useRouter()
  const styles = themeStyles[theme]

  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    allParams.forEach((p) => { initial[p.key] = p.defaultValue })
    return initial
  })

  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [derivedMetrics, setDerivedMetrics] = useState<DerivedMetrics | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [modelEvalOpen, setModelEvalOpen] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const backendStatus = useBackendStatus()

  const liveMetrics = useMemo(() => computeDerivedMetrics(values), [values])

  const handleAnalyze = async () => {
    if (!isAuthenticated) { router.push("/"); return }
    setIsAnalyzing(true)
    setShowResults(false)
    setApiError(null)
    setPlanetAIStatus("processing")

    try {
      const result = await fetchPrediction(values)
      const metrics = computeDerivedMetrics(values)
      setPrediction(result)
      setDerivedMetrics(metrics)
      setShowResults(true)
      setPlanetAIStatus("ready")
    } catch (err: any) {
      setApiError(err.message || "Failed to connect to prediction server.")
      setPlanetAIStatus("offline")
      // Keep previous prediction visible if it exists
      if (prediction) {
        setShowResults(true)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const classificationConfig = {
    habitable: {
      label: "HABITABLE",
      glowClass: theme === "light" ? "shadow-[0_0_40px_rgba(34,197,94,0.3)] border-green-400" : "shadow-[0_0_60px_rgba(34,197,94,0.4)] border-green-400/50",
      ringColor: theme === "light" ? "ring-green-400/30" : "ring-green-400/40",
      textColor: "text-green-400",
      bgColor: "bg-green-500",
    },
    "potentially-habitable": {
      label: "POTENTIALLY HABITABLE",
      glowClass: theme === "light" ? "shadow-[0_0_40px_rgba(234,179,8,0.3)] border-yellow-400" : "shadow-[0_0_60px_rgba(234,179,8,0.4)] border-yellow-400/50",
      ringColor: theme === "light" ? "ring-yellow-400/30" : "ring-yellow-400/40",
      textColor: "text-yellow-400",
      bgColor: "bg-yellow-500",
    },
    "non-habitable": {
      label: "NON-HABITABLE",
      glowClass: theme === "light" ? "shadow-[0_0_40px_rgba(239,68,68,0.3)] border-red-400" : "shadow-[0_0_60px_rgba(239,68,68,0.4)] border-red-400/50",
      ringColor: theme === "light" ? "ring-red-400/30" : "ring-red-400/40",
      textColor: "text-red-400",
      bgColor: "bg-red-500",
    },
  }

  const sliderAccentClass =
    theme === "dark"
      ? "[&_[data-slot=slider-range]]:bg-[#7c7cff] [&_[data-slot=slider-thumb]]:border-[#7c7cff]"
      : theme === "spacePurple"
        ? "[&_[data-slot=slider-range]]:bg-violet-400 [&_[data-slot=slider-thumb]]:border-violet-400"
        : theme === "light"
          ? "[&_[data-slot=slider-range]]:bg-cyan-500 [&_[data-slot=slider-thumb]]:border-cyan-500"
          : "[&_[data-slot=slider-range]]:bg-cyan-400 [&_[data-slot=slider-thumb]]:border-cyan-400"

  const sliderTrackClass =
    theme === "dark"
      ? "[&_[data-slot=slider-track]]:bg-[#1a1c22]"
      : theme === "spacePurple"
        ? "[&_[data-slot=slider-track]]:bg-violet-900/60"
        : theme === "light"
          ? "[&_[data-slot=slider-track]]:bg-slate-200"
          : "[&_[data-slot=slider-track]]:bg-white/10"

  const sectionTitle = (label: string) => (
    <h3 className={`text-xs font-semibold uppercase tracking-widest mb-4 ${theme === "light" ? "text-slate-400" : theme === "dark" ? "text-white/30" : theme === "spacePurple" ? "text-violet-300/50" : "text-cyan-200/40"
      }`}>{label}</h3>
  )

  const renderSliderGroup = (params: SliderParam[]) => (
    <div className="space-y-4">
      {params.map((param) => (
        <div key={param.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${styles.textSecondary}`}>{param.label}</label>
            <span className={`text-sm font-mono font-semibold ${styles.accent} px-2 py-0.5 rounded ${theme === "light" ? "bg-cyan-50" : "bg-white/5"}`}>
              {values[param.key]} {param.unit}
            </span>
          </div>
          <Slider
            min={param.min}
            max={param.max}
            step={param.step}
            value={[values[param.key]]}
            onValueChange={(v) => setValues((prev) => ({ ...prev, [param.key]: v[0] }))}
            className={`${sliderAccentClass} ${sliderTrackClass} [&_[data-slot=slider-thumb]]:hover:shadow-lg [&_[data-slot=slider-thumb]]:transition-shadow ${theme === "dark" ? "[&_[data-slot=slider-thumb]]:hover:shadow-[#7c7cff]/40"
                : theme === "spacePurple" ? "[&_[data-slot=slider-thumb]]:hover:shadow-violet-400/40"
                  : "[&_[data-slot=slider-thumb]]:hover:shadow-cyan-500/40"
              }`}
          />
        </div>
      ))}
    </div>
  )

  const sectionDivider = (
    <div className={`my-6 h-px ${theme === "light" ? "bg-slate-200" : theme === "dark" ? "bg-[#1a1c22]" : theme === "spacePurple" ? "bg-violet-500/20" : "bg-white/10"
      }`} />
  )

  return (
    <div className="p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT PANEL ── */}
        <div className={`rounded-2xl border p-6 ${styles.cardBg} transition-all duration-300 shadow-xl ${theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/10"
          }`}>
          <div className="mb-6">
            <h2 className={`text-xl font-bold ${styles.textPrimary}`}>Planet Habitability Analyzer</h2>
            <p className={`text-sm mt-1 ${styles.textSecondary}`}>Configure planetary parameters to predict habitability</p>
          </div>

          {sectionTitle("Planet Properties")}
          {renderSliderGroup(planetParams)}
          {sectionDivider}
          {sectionTitle("Orbital Properties")}
          {renderSliderGroup(orbitalParams)}
          {sectionDivider}
          {sectionTitle("Star Properties")}
          {renderSliderGroup(starParams)}

          <div className="mt-8">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${isAnalyzing ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
                } ${!isAuthenticated
                  ? theme === "dark" ? "bg-[#1a1c22] text-white/50 border border-[#7c7cff]/20"
                    : theme === "spacePurple" ? "bg-violet-900/50 text-white/50 border border-violet-500/20"
                      : theme === "light" ? "bg-slate-200 text-slate-400 border border-slate-300"
                        : "bg-white/5 text-white/50 border border-white/10"
                  : theme === "dark" ? "bg-gradient-to-r from-[#7c7cff] to-blue-600 text-white shadow-lg shadow-[#7c7cff]/30 hover:shadow-xl hover:shadow-[#7c7cff]/40"
                    : theme === "spacePurple" ? "bg-gradient-to-r from-violet-500 to-blue-600 text-white shadow-lg shadow-violet-500/30"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40"
                } border-0`}
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : !isAuthenticated ? (
                <div className="flex items-center gap-2"><Lock className="w-5 h-5" />Login to Analyze</div>
              ) : (
                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5" />Analyze Habitability</div>
              )}
            </Button>
          </div>

          {/* API Error */}
          {apiError && (
            <div className={`mt-4 p-3 rounded-lg border text-sm ${theme === "light" ? "bg-red-50 border-red-200 text-red-600" : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
              {apiError}. Make sure the backend is running.
            </div>
          )}

          {/* Real-Time Derived Metrics */}
          <div className={`mt-5 rounded-xl border p-4 ${styles.cardBg} transition-all duration-300`}>
            <h4 className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${theme === "light" ? "text-slate-400" : theme === "dark" ? "text-white/30" : theme === "spacePurple" ? "text-violet-300/50" : "text-cyan-200/40"
              }`}>Real-Time Derived Metrics</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {[
                { label: "Surface Gravity", value: `${liveMetrics.surfaceGravity.toFixed(2)} g` },
                { label: "Escape Velocity", value: `${liveMetrics.escapeVelocity.toFixed(1)} km/s` },
                { label: "Habitable Zone", value: liveMetrics.habitableZone, isHZ: true },
                { label: "Atmo. Retention", value: `${liveMetrics.atmosphereRetention}%` },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className={`text-xs ${styles.textMuted}`}>{m.label}</span>
                  <span className={`text-xs font-mono font-semibold transition-all duration-150 ${"isHZ" in m && m.isHZ
                      ? m.value === "Inside" ? "text-green-400" : "text-red-400"
                      : styles.accent
                    }`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-6">

          {/* ── RIGHT PANEL (prediction) ── */}
          <div className={`relative rounded-2xl border p-6 ${styles.cardBg} transition-all duration-300 shadow-xl ${theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/10"
            }`}>

            {/* Guest overlay */}
            {!isAuthenticated && (
              <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden animate-in fade-in-0 duration-500">
                <div className="absolute inset-0 backdrop-blur-[6px] bg-black/40" />
                <div className="relative h-full flex items-center justify-center p-6 min-h-[500px]">
                  <div className={`max-w-sm w-full rounded-xl border p-6 text-center ${styles.cardBg} ${theme === "dark" ? "shadow-[0_0_30px_rgba(124,124,255,0.12)]"
                      : theme === "spacePurple" ? "shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                        : "shadow-[0_0_30px_rgba(6,182,212,0.12)]"
                    }`}>
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-[#7c7cff]/15 ring-1 ring-[#7c7cff]/30"
                        : theme === "spacePurple" ? "bg-violet-500/15 ring-1 ring-violet-400/30"
                          : theme === "light" ? "bg-cyan-100 ring-1 ring-cyan-300/40"
                            : "bg-cyan-500/15 ring-1 ring-cyan-400/30"
                      }`}>
                      <Lock className={`w-6 h-6 ${theme === "dark" ? "text-[#a5a5ff]" : theme === "spacePurple" ? "text-violet-300" : "text-cyan-400"
                        }`} />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${styles.textPrimary}`}>Login required to access ML prediction engine</h3>
                    <p className={`text-sm leading-relaxed mb-5 ${styles.textMuted}`}>Sign in to unlock full AI-powered habitability analysis.</p>
                    <Button
                      onClick={() => router.push("/")}
                      className={`w-full h-11 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-0 ${theme === "dark" ? "bg-gradient-to-r from-[#7c7cff] to-blue-600 text-white shadow-lg shadow-[#7c7cff]/25"
                          : theme === "spacePurple" ? "bg-gradient-to-r from-violet-500 to-blue-600 text-white shadow-lg shadow-violet-500/25"
                            : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                        }`}
                    >Login to Analyze</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state / Offline state */}
            {!prediction && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center min-h-[500px]">
                {backendStatus === "offline" && (
                  <div className={`w-full max-w-xs rounded-2xl border p-6 text-center ${theme === "light" ? "bg-red-50 border-red-200"
                      : theme === "dark" ? "bg-red-500/10 border-red-500/20"
                        : "bg-red-500/10 border-red-400/20"
                    }`}>
                    <div className="flex items-center justify-center mb-4">
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
                      </span>
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${theme === "light" ? "text-red-600" : "text-red-400"}`}>
                      Backend Offline
                    </p>
                    <p className={`text-xs leading-relaxed ${theme === "light" ? "text-red-500/80" : "text-red-300/70"}`}>
                      The prediction server is not reachable.<br />
                      Start the backend on port 5000 to enable AI analysis.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className={`mt-4 text-xs px-4 py-1.5 rounded-lg border transition-colors duration-200 ${theme === "light"
                          ? "border-red-300 text-red-600 hover:bg-red-100"
                          : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        }`}
                    >
                      Retry Connection
                    </button>
                  </div>
                )}

                {backendStatus !== "offline" && (
                  <>
                    <div className={`w-20 h-20 mb-6 rounded-full border-2 border-dashed flex items-center justify-center ${theme === "light" ? "border-slate-300" : "border-white/20"
                      }`}>
                      {backendStatus === "checking"
                        ? <div className={`w-6 h-6 border-2 rounded-full animate-spin ${theme === "dark" ? "border-[#7c7cff]/30 border-t-[#7c7cff]" : "border-cyan-400/30 border-t-cyan-400"
                          }`} />
                        : <Sparkles className={`w-8 h-8 ${styles.textMuted}`} />
                      }
                    </div>
                    <p className={`text-lg font-medium ${styles.textSecondary}`}>
                      {backendStatus === "checking" ? "Connecting to server..." : "No Analysis Yet"}
                    </p>
                    <p className={`text-sm mt-2 ${styles.textMuted} text-center max-w-xs`}>
                      {backendStatus === "checking"
                        ? "Checking backend availability"
                        : "Configure the planetary parameters and click Analyze Habitability to see predictions"
                      }
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Loading state */}
            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center min-h-[500px]">
                <div className="relative w-24 h-24 mb-6">
                  <div className={`absolute inset-0 rounded-full border-2 animate-spin ${theme === "dark" ? "border-[#7c7cff]/30 border-t-[#7c7cff]"
                      : theme === "spacePurple" ? "border-violet-400/30 border-t-violet-400"
                        : "border-cyan-400/30 border-t-cyan-400"
                    }`} style={{ animationDuration: "1s" }} />
                  <div className={`absolute inset-3 rounded-full border-2 animate-spin ${theme === "dark" ? "border-blue-500/20 border-b-blue-500" : "border-blue-400/20 border-b-blue-400"
                    }`} style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
                  <div className={`absolute inset-6 rounded-full animate-pulse ${theme === "dark" ? "bg-[#7c7cff]/20" : theme === "spacePurple" ? "bg-violet-400/20" : "bg-cyan-400/20"
                    }`} />
                </div>
                <p className={`text-lg font-medium ${styles.textPrimary}`}>Analyzing Planet Data...</p>
                <p className={`text-sm mt-1 ${styles.textMuted}`}>Running AI habitability model</p>
              </div>
            )}

            {/* Results */}
            {prediction && showResults && (
              <div className="space-y-6 animate-in fade-in-0 duration-500">

                {/* Backend offline warning */}
                {planetAIStatus === "offline" && (
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs ${theme === "light" ? "bg-red-50 border-red-200 text-red-600" : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                    <span>Backend is offline — showing last prediction. New analyses unavailable.</span>
                  </div>
                )}

                {/* Stale results warning */}
                {planetAIStatus === "offline" && (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs ${theme === "light" ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}>
                    <span>⚠️ Showing last successful prediction. Results may not reflect current slider values.</span>
                  </div>
                )}

                {/* Classification */}
                <div className="flex flex-col items-center">
                  <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${classificationConfig[prediction.classification].glowClass
                    } ${classificationConfig[prediction.classification].ringColor} ring-4`}>
                    <div className="text-center px-2">
                      <div className={`text-xs font-bold tracking-widest uppercase ${classificationConfig[prediction.classification].textColor}`}>
                        {classificationConfig[prediction.classification].label}
                      </div>
                      <div className={`text-xs mt-1 ${styles.textMuted}`}>
                        {Math.round(prediction.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>
                </div>

                {/* Probability Breakdown */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${styles.textSecondary}`}>Probability Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Habitable", value: prediction.probabilities.habitable, color: "bg-green-500" },
                      { label: "Potentially Habitable", value: prediction.probabilities.potential, color: "bg-yellow-500" },
                      { label: "Non-Habitable", value: prediction.probabilities.nonHabitable, color: "bg-red-500" },
                    ].map((bar) => (
                      <div key={bar.label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${styles.textSecondary}`}>{bar.label}</span>
                          <span className={`text-sm font-mono font-semibold ${styles.textPrimary}`}>{bar.value.toFixed(1)}%</span>
                        </div>
                        <div className={`h-2.5 rounded-full overflow-hidden ${theme === "light" ? "bg-slate-200" : theme === "dark" ? "bg-[#1a1c22]" : "bg-white/10"
                          }`}>
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${bar.color}`} style={{ width: `${bar.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Features */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${styles.textSecondary}`}>Top 3 Influential Features</h3>
                  <div className="space-y-3">
                    {prediction.topFeatures.map((feature) => (
                      <div key={feature.label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${styles.textSecondary}`}>{feature.label}</span>
                          <span className={`text-sm font-mono ${styles.accent}`}>{feature.importance}%</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${theme === "light" ? "bg-slate-200" : theme === "dark" ? "bg-[#1a1c22]" : "bg-white/10"
                          }`}>
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${theme === "dark" ? "bg-gradient-to-r from-[#7c7cff] to-blue-500"
                              : theme === "spacePurple" ? "bg-gradient-to-r from-violet-400 to-blue-500"
                                : "bg-gradient-to-r from-cyan-400 to-blue-500"
                            }`} style={{ width: `${feature.importance}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Planet Preview */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${styles.textSecondary}`}>Planet Preview</h3>
                  <div className="relative flex flex-col items-center">
                    <Planet3D classification={prediction.classification} theme={theme} />
                    {prediction.classification === "non-habitable" && (
                      <p className={`mt-3 text-xs text-center max-w-[220px] leading-relaxed ${theme === "light" ? "text-red-500/80" : "text-red-400/70"
                        }`}>This planetary configuration is not stable for life.</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ── MODEL EVALUATION ── */}
          <div className={`rounded-2xl border ${styles.cardBg} transition-all duration-300 shadow-lg ${theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/5"
            }`}>
            <button
              onClick={() => setModelEvalOpen(!modelEvalOpen)}
              className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors duration-200 rounded-2xl ${theme === "light" ? "hover:bg-slate-50"
                  : theme === "dark" ? "hover:bg-[#101218]/60"
                    : theme === "spacePurple" ? "hover:bg-violet-800/20"
                      : "hover:bg-white/5"
                }`}
            >
              <span className={`text-sm font-semibold ${styles.textSecondary}`}>Model Evaluation</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${styles.textMuted} ${modelEvalOpen ? "rotate-180" : ""}`} />
            </button>

            <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{
              maxHeight: modelEvalOpen ? "400px" : "0px",
              opacity: modelEvalOpen ? 1 : 0,
            }}>
              <div className="px-5 pb-5 pt-1">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Algorithm", value: "Random Forest" },
                    { label: "Accuracy", value: "99.45%" },
                    { label: "F1 (macro)", value: "94.17%" },
                    { label: "F1 (weighted)", value: "99.43%" },
                    { label: "CV F1 Score", value: "97.13% ±3.4" },
                    { label: "Training size", value: "2,927 planets" },
                  ].map((m) => (
                    <div key={m.label} className={`flex flex-col gap-1 p-2.5 rounded-lg ${theme === "light" ? "bg-slate-50 border border-slate-100"
                        : theme === "dark" ? "bg-[#0b0c10]/60 border border-[#1a1c22]/60"
                          : theme === "spacePurple" ? "bg-violet-900/20 border border-violet-500/10"
                            : "bg-white/[0.03] border border-white/5"
                      }`}>
                      <span className={`text-[10px] uppercase tracking-wider ${theme === "light" ? "text-slate-400" : theme === "dark" ? "text-white/30"
                          : theme === "spacePurple" ? "text-violet-300/40" : "text-cyan-200/35"
                        }`}>{m.label}</span>
                      <span className={`text-xs font-mono font-semibold ${styles.accent}`}>{m.value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <span className={`text-[10px] uppercase tracking-wider block mb-2 ${theme === "light" ? "text-slate-400" : theme === "dark" ? "text-white/30"
                      : theme === "spacePurple" ? "text-violet-300/40" : "text-cyan-200/35"
                    }`}>Confusion Matrix</span>
                  <div className="grid grid-cols-4 gap-px text-center text-[9px]">
                    <div className={`py-1 ${styles.textMuted}`}></div>
                    <div className={`py-1 font-medium ${styles.textMuted}`}>Non-Hab</div>
                    <div className={`py-1 font-medium ${styles.textMuted}`}>Potential</div>
                    <div className={`py-1 font-medium ${styles.textMuted}`}>Habitable</div>
                    <div className={`py-1 font-medium ${styles.textMuted}`}>Non-Hab</div>
                    <div className={`py-1.5 rounded font-mono font-semibold ${theme === "light" ? "bg-green-50 text-green-700" : "bg-green-500/10 text-green-400"}`}>332</div>
                    <div className={`py-1.5 rounded font-mono ${theme === "light" ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400/70"}`}>2</div>
                    <div className={`py-1.5 rounded font-mono ${theme === "light" ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400/70"}`}>0</div>
                    <div className={`py-1 font-medium ${styles.textMuted}`}>Potential</div>
                    <div className={`py-1.5 rounded font-mono ${theme === "light" ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400/70"}`}>0</div>
                    <div className={`py-1.5 rounded font-mono font-semibold ${theme === "light" ? "bg-green-50 text-green-700" : "bg-green-500/10 text-green-400"}`}>391</div>
                    <div className={`py-1.5 rounded font-mono ${theme === "light" ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400/70"}`}>0</div>
                    <div className={`py-1 font-medium ${styles.textMuted}`}>Habitable</div>
                    <div className={`py-1.5 rounded font-mono ${theme === "light" ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400/70"}`}>0</div>
                    <div className={`py-1.5 rounded font-mono ${theme === "light" ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400/70"}`}>2</div>
                    <div className={`py-1.5 rounded font-mono font-semibold ${theme === "light" ? "bg-green-50 text-green-700" : "bg-green-500/10 text-green-400"}`}>5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
