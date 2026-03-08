"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCosmoTheme } from "@/components/cosmo-theme-context"
import { themeStyles } from "@/lib/themes"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Sparkles, Lock, ChevronDown } from "lucide-react"

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
  { key: "mass", label: "Planet Mass", min: 0.1, max: 50, step: 0.1, defaultValue: 1, unit: "Earth masses" },
  { key: "radius", label: "Planet Radius", min: 0.1, max: 25, step: 0.1, defaultValue: 1, unit: "Earth radii" },
  { key: "temperature", label: "Surface Temperature", min: 50, max: 1000, step: 5, defaultValue: 288, unit: "K" },
  { key: "pressure", label: "Atmospheric Pressure", min: 0, max: 200, step: 0.1, defaultValue: 1, unit: "atm" },
  { key: "greenhouse", label: "Greenhouse Effect Factor", min: 0, max: 2, step: 0.01, defaultValue: 0.3, unit: "" },
]

const orbitalParams: SliderParam[] = [
  { key: "semiMajorAxis", label: "Semi-Major Axis", min: 0.01, max: 100, step: 0.01, defaultValue: 1, unit: "AU" },
  { key: "orbitalPeriod", label: "Orbital Period", min: 1, max: 10000, step: 1, defaultValue: 365, unit: "days" },
  { key: "stellarFlux", label: "Stellar Flux", min: 0.01, max: 10, step: 0.01, defaultValue: 1, unit: "S/S\u2609" },
]

const starParams: SliderParam[] = [
  { key: "starTemp", label: "Star Temperature", min: 2000, max: 40000, step: 100, defaultValue: 5778, unit: "K" },
  { key: "starLuminosity", label: "Star Luminosity", min: 0.001, max: 1000, step: 0.001, defaultValue: 1, unit: "L\u2609" },
]

const allParams = [...planetParams, ...orbitalParams, ...starParams]

// ---------------------------------------------------------------------------
// Prediction model
// ---------------------------------------------------------------------------

type PredictionClass = "habitable" | "potentially-habitable" | "non-habitable"

interface PredictionResult {
  classification: PredictionClass
  probabilities: { habitable: number; potential: number; nonHabitable: number }
  topFeatures: { label: string; importance: number }[]
}

function computePrediction(values: Record<string, number>): PredictionResult {
  const tempScore = values.temperature >= 200 && values.temperature <= 350 ? 1 : values.temperature >= 150 && values.temperature <= 400 ? 0.5 : 0
  const massScore = values.mass >= 0.5 && values.mass <= 5 ? 1 : values.mass >= 0.1 && values.mass <= 10 ? 0.5 : 0
  const radiusScore = values.radius >= 0.5 && values.radius <= 2.5 ? 1 : values.radius >= 0.3 && values.radius <= 5 ? 0.5 : 0
  const fluxScore = values.stellarFlux >= 0.3 && values.stellarFlux <= 1.7 ? 1 : values.stellarFlux >= 0.1 && values.stellarFlux <= 3 ? 0.5 : 0
  const axisScore = values.semiMajorAxis >= 0.7 && values.semiMajorAxis <= 1.5 ? 1 : values.semiMajorAxis >= 0.3 && values.semiMajorAxis <= 5 ? 0.5 : 0
  const starTempScore = values.starTemp >= 4000 && values.starTemp <= 7000 ? 1 : values.starTemp >= 3000 && values.starTemp <= 10000 ? 0.5 : 0
  const periodScore = values.orbitalPeriod >= 200 && values.orbitalPeriod <= 500 ? 1 : values.orbitalPeriod >= 50 && values.orbitalPeriod <= 2000 ? 0.5 : 0
  const pressureScore = values.pressure >= 0.5 && values.pressure <= 2 ? 1 : values.pressure >= 0.1 && values.pressure <= 10 ? 0.5 : 0
  const greenhouseScore = values.greenhouse >= 0.1 && values.greenhouse <= 0.5 ? 1 : values.greenhouse >= 0 && values.greenhouse <= 1 ? 0.5 : 0
  const lumScore = values.starLuminosity >= 0.5 && values.starLuminosity <= 2 ? 1 : values.starLuminosity >= 0.1 && values.starLuminosity <= 10 ? 0.5 : 0

  const totalScore =
    tempScore * 0.20 +
    massScore * 0.12 +
    radiusScore * 0.12 +
    fluxScore * 0.12 +
    axisScore * 0.08 +
    starTempScore * 0.08 +
    periodScore * 0.08 +
    pressureScore * 0.08 +
    greenhouseScore * 0.06 +
    lumScore * 0.06

  let habitable: number, potential: number, nonHabitable: number
  if (totalScore >= 0.7) {
    habitable = 60 + totalScore * 30
    potential = 100 - habitable - (5 + (1 - totalScore) * 10)
    nonHabitable = 100 - habitable - potential
  } else if (totalScore >= 0.4) {
    potential = 40 + totalScore * 30
    habitable = totalScore * 25
    nonHabitable = 100 - habitable - potential
  } else {
    nonHabitable = 60 + (1 - totalScore) * 30
    potential = (100 - nonHabitable) * 0.6
    habitable = 100 - nonHabitable - potential
  }

  habitable = Math.max(1, Math.min(95, Math.round(habitable * 10) / 10))
  potential = Math.max(1, Math.min(95, Math.round(potential * 10) / 10))
  nonHabitable = Math.max(1, Math.round((100 - habitable - potential) * 10) / 10)

  const classification: PredictionClass =
    habitable > potential && habitable > nonHabitable
      ? "habitable"
      : potential > nonHabitable
        ? "potentially-habitable"
        : "non-habitable"

  const features = [
    { label: "Surface Temperature", importance: tempScore * 20 },
    { label: "Stellar Flux", importance: fluxScore * 12 },
    { label: "Planet Mass", importance: massScore * 12 },
    { label: "Planet Radius", importance: radiusScore * 12 },
    { label: "Semi-Major Axis", importance: axisScore * 8 },
    { label: "Star Temperature", importance: starTempScore * 8 },
    { label: "Orbital Period", importance: periodScore * 8 },
    { label: "Atmo. Pressure", importance: pressureScore * 8 },
    { label: "Greenhouse Factor", importance: greenhouseScore * 6 },
    { label: "Star Luminosity", importance: lumScore * 6 },
  ]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3)

  const maxImportance = Math.max(...features.map((f) => f.importance))
  const topFeatures = features.map((f) => ({
    label: f.label,
    importance: maxImportance > 0 ? Math.round((f.importance / maxImportance) * 100) : 0,
  }))

  return { classification, probabilities: { habitable, potential, nonHabitable }, topFeatures }
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
  const mass = values.mass
  const radius = values.radius
  // Surface gravity in g (Earth = 1)
  const surfaceGravity = mass / (radius * radius)
  // Escape velocity relative to Earth (11.2 km/s)
  const escapeVelocity = Math.sqrt(mass / radius) * 11.2

  // Atmosphere retention score: depends on gravity, temperature, and pressure
  const gravityFactor = Math.min(surfaceGravity / 0.5, 1)
  const tempFactor = values.temperature < 500 ? 1 : values.temperature < 800 ? 0.5 : 0.1
  const pressureFactor = values.pressure > 0.01 ? Math.min(values.pressure / 1, 1) : 0
  const atmosphereRetention = Math.round(Math.min(1, gravityFactor * tempFactor * pressureFactor) * 100)

  // Habitable zone check via stellar flux
  const habitableZone: "Inside" | "Outside" =
    values.stellarFlux >= 0.2 && values.stellarFlux <= 2.0 ? "Inside" : "Outside"

  // Temperature stability index: favours moderate temperatures with low greenhouse
  const tempDev = Math.abs(values.temperature - 288) / 288
  const ghDeviation = Math.abs(values.greenhouse - 0.3)
  const temperatureStability = Math.round(Math.max(0, (1 - tempDev * 0.8 - ghDeviation * 0.5)) * 100)

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
    // non-habitable: muted red, drawn blurry
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

      // Atmospheric glow
      const glowGrad = ctx.createRadialGradient(cx, cy, r, cx, cy, r * 1.8)
      glowGrad.addColorStop(0, colors.glow)
      glowGrad.addColorStop(1, "transparent")
      ctx.fillStyle = glowGrad
      ctx.fillRect(0, 0, size, size)

      // Non-habitable: apply canvas blur for the "blurred placeholder" effect
      if (classification === "non-habitable") {
        ctx.filter = "blur(3px)"
      }

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

      // Atmospheric ring
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

  return (
    <canvas
      ref={canvasRef}
      className="w-[160px] h-[160px]"
      style={{ imageRendering: "auto" }}
    />
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PlanetAIContent() {
  const { theme, isAuthenticated, setPlanetAIStatus } = useCosmoTheme()
  const router = useRouter()
  const styles = themeStyles[theme]

  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    allParams.forEach((p) => {
      initial[p.key] = p.defaultValue
    })
    return initial
  })

  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [derivedMetrics, setDerivedMetrics] = useState<DerivedMetrics | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [modelEvalOpen, setModelEvalOpen] = useState(false)

  // Live-computed metrics that update instantly as sliders move
  const liveMetrics = useMemo(() => computeDerivedMetrics(values), [values])

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    setShowResults(false)
    setPlanetAIStatus("processing")
    setTimeout(() => {
      const result = computePrediction(values)
      const metrics = computeDerivedMetrics(values)
      setPrediction(result)
      setDerivedMetrics(metrics)
      setIsAnalyzing(false)
      setShowResults(true)
      setPlanetAIStatus("ready")
    }, 1500)
  }

  const classificationConfig = {
    habitable: {
      label: "HABITABLE",
      glowClass:
        theme === "light"
          ? "shadow-[0_0_40px_rgba(34,197,94,0.3)] border-green-400"
          : "shadow-[0_0_60px_rgba(34,197,94,0.4)] border-green-400/50",
      ringColor: theme === "light" ? "ring-green-400/30" : "ring-green-400/40",
      textColor: "text-green-400",
      bgColor: "bg-green-500",
    },
    "potentially-habitable": {
      label: "POTENTIALLY HABITABLE",
      glowClass:
        theme === "light"
          ? "shadow-[0_0_40px_rgba(234,179,8,0.3)] border-yellow-400"
          : "shadow-[0_0_60px_rgba(234,179,8,0.4)] border-yellow-400/50",
      ringColor: theme === "light" ? "ring-yellow-400/30" : "ring-yellow-400/40",
      textColor: "text-yellow-400",
      bgColor: "bg-yellow-500",
    },
    "non-habitable": {
      label: "NON-HABITABLE",
      glowClass:
        theme === "light"
          ? "shadow-[0_0_40px_rgba(239,68,68,0.3)] border-red-400"
          : "shadow-[0_0_60px_rgba(239,68,68,0.4)] border-red-400/50",
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

  // Section title helper
  const sectionTitle = (label: string) => (
    <h3
      className={`text-xs font-semibold uppercase tracking-widest mb-4 ${
        theme === "light" ? "text-slate-400" : theme === "dark" ? "text-white/30" : theme === "spacePurple" ? "text-violet-300/50" : "text-cyan-200/40"
      }`}
    >
      {label}
    </h3>
  )

  const renderSliderGroup = (params: SliderParam[]) => (
    <div className="space-y-4">
      {params.map((param) => (
        <div key={param.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${styles.textSecondary}`}>{param.label}</label>
            <span
              className={`text-sm font-mono font-semibold ${styles.accent} px-2 py-0.5 rounded ${
                theme === "light" ? "bg-cyan-50" : "bg-white/5"
              }`}
            >
              {values[param.key]} {param.unit}
            </span>
          </div>
          <Slider
            min={param.min}
            max={param.max}
            step={param.step}
            value={[values[param.key]]}
            onValueChange={(v) => setValues((prev) => ({ ...prev, [param.key]: v[0] }))}
            className={`${sliderAccentClass} ${sliderTrackClass} [&_[data-slot=slider-thumb]]:hover:shadow-lg [&_[data-slot=slider-thumb]]:transition-shadow ${
              theme === "dark"
                ? "[&_[data-slot=slider-thumb]]:hover:shadow-[#7c7cff]/40"
                : theme === "spacePurple"
                  ? "[&_[data-slot=slider-thumb]]:hover:shadow-violet-400/40"
                  : "[&_[data-slot=slider-thumb]]:hover:shadow-cyan-500/40"
            }`}
          />
        </div>
      ))}
    </div>
  )

  const sectionDivider = (
    <div
      className={`my-6 h-px ${
        theme === "light" ? "bg-slate-200" : theme === "dark" ? "bg-[#1a1c22]" : theme === "spacePurple" ? "bg-violet-500/20" : "bg-white/10"
      }`}
    />
  )

  return (
    <div className="p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================================= */}
        {/* LEFT PANEL - Input Controls                                    */}
        {/* ============================================================= */}
        <div
          className={`rounded-2xl border p-6 ${styles.cardBg} transition-all duration-300 shadow-xl ${
            theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/10"
          }`}
        >
          <div className="mb-6">
            <h2 className={`text-xl font-bold ${styles.textPrimary}`}>Planet Habitability Analyzer</h2>
            <p className={`text-sm mt-1 ${styles.textSecondary}`}>
              Configure planetary parameters to predict habitability
            </p>
          </div>

          {/* SECTION 1: Planet Properties */}
          {sectionTitle("Planet Properties")}
          {renderSliderGroup(planetParams)}

          {sectionDivider}

          {/* SECTION 2: Orbital Properties */}
          {sectionTitle("Orbital Properties")}
          {renderSliderGroup(orbitalParams)}

          {sectionDivider}

          {/* SECTION 3: Star Properties */}
          {sectionTitle("Star Properties")}
          {renderSliderGroup(starParams)}

          {/* Analyze Button */}
          <div className="mt-8">
            <Button
              onClick={isAuthenticated ? handleAnalyze : () => router.push("/")}
              disabled={isAnalyzing}
              className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${
                isAnalyzing
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              } ${
                !isAuthenticated
                  ? theme === "dark"
                    ? "bg-[#1a1c22] text-white/50 border border-[#7c7cff]/20"
                    : theme === "spacePurple"
                      ? "bg-violet-900/50 text-white/50 border border-violet-500/20"
                      : theme === "light"
                        ? "bg-slate-200 text-slate-400 border border-slate-300"
                        : "bg-white/5 text-white/50 border border-white/10"
                  : theme === "dark"
                    ? "bg-gradient-to-r from-[#7c7cff] to-blue-600 text-white shadow-lg shadow-[#7c7cff]/30 hover:shadow-xl hover:shadow-[#7c7cff]/40"
                    : theme === "spacePurple"
                      ? "bg-gradient-to-r from-violet-500 to-blue-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40"
                      : theme === "light"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40"
              } border-0`}
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : !isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Login to Analyze
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Analyze Habitability
                </div>
              )}
            </Button>
          </div>

          {/* Real-Time Derived Metrics */}
          <div
            className={`mt-5 rounded-xl border p-4 ${styles.cardBg} transition-all duration-300`}
          >
            <h4
              className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${
                theme === "light" ? "text-slate-400" : theme === "dark" ? "text-white/30" : theme === "spacePurple" ? "text-violet-300/50" : "text-cyan-200/40"
              }`}
            >
              Real-Time Derived Metrics
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {[
                { label: "Surface Gravity", value: `${liveMetrics.surfaceGravity.toFixed(2)} g` },
                { label: "Escape Velocity", value: `${liveMetrics.escapeVelocity.toFixed(1)} km/s` },
                {
                  label: "Habitable Zone",
                  value: liveMetrics.habitableZone,
                  isHZ: true,
                },
                { label: "Atmo. Retention", value: `${liveMetrics.atmosphereRetention}%` },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className={`text-xs ${styles.textMuted}`}>{m.label}</span>
                  <span
                    className={`text-xs font-mono font-semibold transition-all duration-150 ${
                      "isHZ" in m && m.isHZ
                        ? m.value === "Inside"
                          ? "text-green-400"
                          : "text-red-400"
                        : styles.accent
                    }`}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* RIGHT PANEL - Prediction Output                                */}
        {/* ============================================================= */}
        <div className="flex flex-col gap-6">
          {/* Prediction Card */}
          <div
            className={`relative rounded-2xl border p-6 ${styles.cardBg} transition-all duration-300 shadow-xl ${
              theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/10"
            }`}
          >
            {/* Guest Mode: Prediction panel overlay */}
            {!isAuthenticated && (
              <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden animate-in fade-in-0 duration-500">
                <div className="absolute inset-0 backdrop-blur-[6px] bg-black/40" />
                <div className="relative h-full flex items-center justify-center p-6 min-h-[500px]">
                  <div
                    className={`max-w-sm w-full rounded-xl border p-6 text-center ${styles.cardBg} ${
                      theme === "dark"
                        ? "shadow-[0_0_30px_rgba(124,124,255,0.12)]"
                        : theme === "spacePurple"
                          ? "shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                          : "shadow-[0_0_30px_rgba(6,182,212,0.12)]"
                    }`}
                  >
                    <div
                      className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        theme === "dark"
                          ? "bg-[#7c7cff]/15 ring-1 ring-[#7c7cff]/30"
                          : theme === "spacePurple"
                            ? "bg-violet-500/15 ring-1 ring-violet-400/30"
                            : theme === "light"
                              ? "bg-cyan-100 ring-1 ring-cyan-300/40"
                              : "bg-cyan-500/15 ring-1 ring-cyan-400/30"
                      }`}
                    >
                      <Lock
                        className={`w-6 h-6 ${
                          theme === "dark" ? "text-[#a5a5ff]" : theme === "spacePurple" ? "text-violet-300" : "text-cyan-400"
                        }`}
                      />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${styles.textPrimary}`}>
                      Login required to access ML prediction engine
                    </h3>
                    <p className={`text-sm leading-relaxed mb-5 ${styles.textMuted}`}>
                      Sign in to unlock full AI-powered habitability analysis and planetary predictions.
                    </p>
                    <Button
                      onClick={() => router.push("/")}
                      className={`w-full h-11 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-0 ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-[#7c7cff] to-blue-600 text-white shadow-lg shadow-[#7c7cff]/25"
                          : theme === "spacePurple"
                            ? "bg-gradient-to-r from-violet-500 to-blue-600 text-white shadow-lg shadow-violet-500/25"
                            : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                      }`}
                    >
                      Login to Analyze
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!prediction && !isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center min-h-[500px]">
                <div
                  className={`w-20 h-20 mb-6 rounded-full border-2 border-dashed flex items-center justify-center ${
                    theme === "light" ? "border-slate-300" : "border-white/20"
                  }`}
                >
                  <Sparkles className={`w-8 h-8 ${styles.textMuted}`} />
                </div>
                <p className={`text-lg font-medium ${styles.textSecondary}`}>No Analysis Yet</p>
                <p className={`text-sm mt-2 ${styles.textMuted} text-center max-w-xs`}>
                  Configure the planetary parameters and click Analyze Habitability to see predictions
                </p>
              </div>
            ) : isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center min-h-[500px]">
                <div className="relative w-24 h-24 mb-6">
                  <div
                    className={`absolute inset-0 rounded-full border-2 animate-spin ${
                      theme === "dark"
                        ? "border-[#7c7cff]/30 border-t-[#7c7cff]"
                        : theme === "spacePurple"
                          ? "border-violet-400/30 border-t-violet-400"
                          : "border-cyan-400/30 border-t-cyan-400"
                    }`}
                    style={{ animationDuration: "1s" }}
                  />
                  <div
                    className={`absolute inset-3 rounded-full border-2 animate-spin ${
                      theme === "dark"
                        ? "border-blue-500/20 border-b-blue-500"
                        : theme === "spacePurple"
                          ? "border-blue-400/20 border-b-blue-400"
                          : "border-blue-400/20 border-b-blue-400"
                    }`}
                    style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
                  />
                  <div
                    className={`absolute inset-6 rounded-full ${
                      theme === "dark"
                        ? "bg-[#7c7cff]/20"
                        : theme === "spacePurple"
                          ? "bg-violet-400/20"
                          : "bg-cyan-400/20"
                    } animate-pulse`}
                  />
                </div>
                <p className={`text-lg font-medium ${styles.textPrimary}`}>Analyzing Planet Data...</p>
                <p className={`text-sm mt-1 ${styles.textMuted}`}>Running AI habitability model</p>
              </div>
            ) : prediction && showResults ? (
              <div className="space-y-6 animate-in fade-in-0 duration-500">
                {/* Classification Indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-32 h-32 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                      classificationConfig[prediction.classification].glowClass
                    } ${classificationConfig[prediction.classification].ringColor} ring-4`}
                  >
                    <div className="text-center">
                      <div
                        className={`text-xs font-bold tracking-widest uppercase ${classificationConfig[prediction.classification].textColor}`}
                      >
                        {classificationConfig[prediction.classification].label}
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
                          <span className={`text-sm font-mono font-semibold ${styles.textPrimary}`}>
                            {bar.value.toFixed(1)}%
                          </span>
                        </div>
                        <div
                          className={`h-2.5 rounded-full overflow-hidden ${
                            theme === "light" ? "bg-slate-200" : theme === "dark" ? "bg-[#1a1c22]" : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${bar.color}`}
                            style={{ width: `${bar.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Influential Features */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${styles.textSecondary}`}>Top 3 Influential Features</h3>
                  <div className="space-y-3">
                    {prediction.topFeatures.map((feature) => (
                      <div key={feature.label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${styles.textSecondary}`}>{feature.label}</span>
                          <span className={`text-sm font-mono ${styles.accent}`}>{feature.importance}%</span>
                        </div>
                        <div
                          className={`h-2 rounded-full overflow-hidden ${
                            theme === "light" ? "bg-slate-200" : theme === "dark" ? "bg-[#1a1c22]" : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              theme === "dark"
                                ? "bg-gradient-to-r from-[#7c7cff] to-blue-500"
                                : theme === "spacePurple"
                                  ? "bg-gradient-to-r from-violet-400 to-blue-500"
                                  : "bg-gradient-to-r from-cyan-400 to-blue-500"
                            }`}
                            style={{ width: `${feature.importance}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3D Planet Preview */}
                <div>
                  <h3 className={`text-sm font-semibold mb-4 ${styles.textSecondary}`}>Planet Preview</h3>
                  <div className="relative flex flex-col items-center">
                    <Planet3D classification={prediction.classification} theme={theme} />
                    {prediction.classification === "non-habitable" && (
                      <p className={`mt-3 text-xs text-center max-w-[220px] leading-relaxed ${
                        theme === "light" ? "text-red-500/80" : "text-red-400/70"
                      }`}>
                        This planetary configuration is not stable for life.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* ============================================================= */}
          {/* MODEL EVALUATION - Collapsible                                 */}
          {/* ============================================================= */}
          <div
            className={`rounded-2xl border ${styles.cardBg} transition-all duration-300 shadow-lg ${
              theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/5"
            }`}
          >
            <button
              onClick={() => setModelEvalOpen(!modelEvalOpen)}
              className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors duration-200 rounded-2xl ${
                theme === "light" ? "hover:bg-slate-50" : theme === "dark" ? "hover:bg-[#101218]/60" : theme === "spacePurple" ? "hover:bg-violet-800/20" : "hover:bg-white/5"
              }`}
            >
              <span className={`text-sm font-semibold ${styles.textSecondary}`}>Model Evaluation</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${styles.textMuted} ${modelEvalOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: modelEvalOpen ? "400px" : "0px",
                opacity: modelEvalOpen ? 1 : 0,
              }}
            >
              <div className={`px-5 pb-5 pt-1`}>
                {/* Metrics 2x2 grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Model Version", value: "v1.0" },
                    { label: "Accuracy", value: "94.2%" },
                    { label: "Precision", value: "91.7%" },
                    { label: "Recall", value: "89.4%" },
                    { label: "F1 Score", value: "90.5%" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className={`flex flex-col gap-1 p-2.5 rounded-lg ${
                        theme === "light"
                          ? "bg-slate-50 border border-slate-100"
                          : theme === "dark"
                            ? "bg-[#0b0c10]/60 border border-[#1a1c22]/60"
                            : theme === "spacePurple"
                              ? "bg-violet-900/20 border border-violet-500/10"
                              : "bg-white/[0.03] border border-white/5"
                      }`}
                    >
                      <span
                        className={`text-[10px] uppercase tracking-wider ${
                          theme === "light" ? "text-slate-400" : theme === "dark" ? "text-white/30" : theme === "spacePurple" ? "text-violet-300/40" : "text-cyan-200/35"
                        }`}
                      >
                        {m.label}
                      </span>
                      <span className={`text-xs font-mono font-semibold ${styles.accent}`}>{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Compact Confusion Matrix */}
                <div>
                  <span
                    className={`text-[10px] uppercase tracking-wider block mb-2 ${
                      theme === "light" ? "text-slate-400" : theme === "dark" ? "text-white/30" : theme === "spacePurple" ? "text-violet-300/40" : "text-cyan-200/35"
                    }`}
                  >
                    Confusion Matrix (Normalized)
                  </span>
                  <div className="grid grid-cols-3 gap-px text-center">
                    {/* Header row */}
                    <div className={`text-[9px] font-medium py-1 ${styles.textMuted}`} />
                    <div className={`text-[9px] font-medium py-1 ${styles.textMuted}`}>Pred +</div>
                    <div className={`text-[9px] font-medium py-1 ${styles.textMuted}`}>Pred -</div>
                    {/* Actual + row */}
                    <div className={`text-[9px] font-medium py-1 ${styles.textMuted}`}>Act +</div>
                    <div
                      className={`text-[10px] font-mono font-semibold py-1.5 rounded ${
                        theme === "light" ? "bg-green-50 text-green-700" : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      0.89
                    </div>
                    <div
                      className={`text-[10px] font-mono py-1.5 rounded ${
                        theme === "light" ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400/70"
                      }`}
                    >
                      0.11
                    </div>
                    {/* Actual - row */}
                    <div className={`text-[9px] font-medium py-1 ${styles.textMuted}`}>Act -</div>
                    <div
                      className={`text-[10px] font-mono py-1.5 rounded ${
                        theme === "light" ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400/70"
                      }`}
                    >
                      0.06
                    </div>
                    <div
                      className={`text-[10px] font-mono font-semibold py-1.5 rounded ${
                        theme === "light" ? "bg-green-50 text-green-700" : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      0.94
                    </div>
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
