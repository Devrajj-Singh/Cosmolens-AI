"use client"

import { subscribeToAuthState } from "@/lib/firebase/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { Rocket, Globe, Layers, Cpu, BarChart3, SlidersHorizontal, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Suspense, useEffect, useRef, useState } from "react"

const team = [
  { name: "Devraj Singh", role: "Project Lead / Overall", initials: "DS" },
  { name: "Aryan Sirohi", role: "Frontend Developer", initials: "AS" },
  { name: "Vaishnavee", role: "Frontend Developer / Tester", initials: "V" },
  { name: "Tanmay Goyal", role: "Backend Developer / Overall", initials: "TG" },
  { name: "Ayleen Toppo", role: "Backend Developer", initials: "AT" },
]

const architectureItems = [
  "Dual-Module Design",
  "Physics-Based Feature Engineering",
  "Machine Learning Classification Pipeline",
  "Interactive 3D Rendering Engine",
]

const howItWorks = [
  {
    icon: SlidersHorizontal,
    step: "01",
    title: "Input Astronomical Parameters",
    description: "Define orbital, stellar, and physical properties of the planetary system.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Physics-Based Feature Derivation",
    description: "Compute surface gravity, escape velocity, habitable zone position, and atmosphere retention.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Multi-Class Habitability Prediction",
    description: "Classify the planet as Habitable, Potentially Habitable, or Non-Habitable.",
  },
]

function HomePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuth, setIsAuth] = useState(searchParams.get("auth") !== "false")
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    return subscribeToAuthState((user) => {
      setIsAuth(Boolean(user))
    })
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.volume = 0.18
    video.muted = isMuted
    void video.play().catch(() => {})
  }, [isMuted])

  const handleLaunchExplorer = () => {
    router.push(isAuth ? "/explorer" : "/explorer?auth=false")
  }

  const handleLaunchPlanetAI = () => {
    router.push(isAuth ? "/planet-ai" : "/planet-ai?auth=false")
  }

  const toggleAudio = async () => {
    const video = videoRef.current
    if (!video) return

    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    video.volume = 0.18
    video.muted = nextMuted
    await video.play().catch(() => {})
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <video
        ref={videoRef}
        className="fixed inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/space-bg.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-black/55" />

      <button
        type="button"
        onClick={toggleAudio}
        className="fixed right-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/55"
        aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Animated star particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${((i * 37 + 13) % 100)}%`,
              top: `${((i * 53 + 7) % 100)}%`,
              opacity: 0.2 + ((i % 5) * 0.1),
              animationDelay: `${(i * 0.3) % 3}s`,
              animationDuration: `${2 + (i % 3)}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* ================================================================ */}
        {/* HERO SECTION                                                     */}
        {/* ================================================================ */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Cosmic lens icon */}
            <div className="mx-auto w-20 h-20 mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full" />
              </div>
              <div
                className="absolute inset-0 border-2 border-cyan-400/50 rounded-full animate-spin"
                style={{ animationDuration: "8s" }}
              />
            </div>

            <div className="relative">
              <div className="absolute -inset-x-20 -inset-y-10 bg-gradient-to-r from-cyan-500/20 via-blue-500/30 to-purple-500/20 blur-3xl opacity-50 rounded-full" />
              <h1 className="relative text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 text-balance">
                Explore and Predict the Cosmos with AI
              </h1>
            </div>
            <p className="text-lg md:text-xl text-cyan-100/80 max-w-3xl mx-auto mb-10 text-pretty">
              CosmoLens AI combines immersive astronomical visualization with a physics-informed machine learning engine
              to analyze and predict planetary habitability.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleLaunchExplorer}
                className="h-14 px-8 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/50 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Launch Explorer
              </Button>
              <Button
                onClick={handleLaunchPlanetAI}
                className="h-14 px-8 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Globe className="w-5 h-5 mr-2" />
                Open Planet AI
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" />
        </section>

        {/* ================================================================ */}
        {/* CORE AI MODULES                                                  */}
        {/* ================================================================ */}
        <section id="features" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4 text-balance">
              Core AI Modules
            </h2>
            <p className="text-cyan-100/60 text-center mb-16 max-w-2xl mx-auto">
              Two specialized systems working together to visualize and analyze the cosmos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Explorer Module Card */}
              <div className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 transition-all duration-300 hover:bg-white/[0.08] hover:border-cyan-400/25 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-cyan-500/10">
                <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/0 to-blue-500/0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl" />
                <div className="relative">
                  <div className="w-12 h-12 mb-5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-400/20">
                    <Rocket className="w-6 h-6 text-cyan-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Explorer Module</h3>
                  <p className="text-sm text-cyan-100/60 leading-relaxed mb-5">
                    Interactive 3D visualization of galaxies, stars, and celestial objects powered by curated
                    astronomical datasets.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "WebGL-based rendering",
                      "Structured object analysis",
                      "Timeline and research notes",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2.5">
                        <div className="w-1 h-1 rounded-full bg-cyan-400/60 shrink-0" />
                        <span className="text-sm text-cyan-100/50">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Planet AI Module Card */}
              <div className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 transition-all duration-300 hover:bg-white/[0.08] hover:border-emerald-400/25 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-emerald-500/10">
                <div className="absolute -inset-px bg-gradient-to-br from-emerald-500/0 to-teal-500/0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl" />
                <div className="relative">
                  <div className="w-12 h-12 mb-5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-400/20">
                    <Globe className="w-6 h-6 text-emerald-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Planet AI Module</h3>
                  <p className="text-sm text-cyan-100/60 leading-relaxed mb-5">
                    Physics-informed machine learning system for multi-class planetary habitability prediction.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "Multi-class classification (Habitable / Potential / Non-Habitable)",
                      "Feature importance analysis",
                      "Real-time derived physical metrics",
                      "Model evaluation transparency",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-400/60 shrink-0" />
                        <span className="text-sm text-cyan-100/50">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* HOW IT WORKS                                                     */}
        {/* ================================================================ */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4 text-balance">
              How It Works
            </h2>
            <p className="text-cyan-100/60 text-center mb-16 max-w-xl mx-auto">
              From raw parameters to habitability classification in three steps.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {howItWorks.map((step) => (
                <div
                  key={step.step}
                  className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.08] shadow-lg shadow-black/20"
                >
                  <span className="text-[11px] font-mono font-semibold text-cyan-400/40 uppercase tracking-widest mb-4 block">
                    Step {step.step}
                  </span>
                  <div className="w-10 h-10 mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-cyan-300/70" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-cyan-100/50 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SYSTEM ARCHITECTURE                                              */}
        {/* ================================================================ */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/30">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest text-center mb-8">
                System Architecture
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {architectureItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all duration-200 hover:bg-white/[0.06]"
                  >
                    <Layers className="w-4 h-4 text-cyan-400/50 shrink-0" />
                    <span className="text-sm text-cyan-100/60">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* TEAM SECTION                                                     */}
        {/* ================================================================ */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">Meet the Team</h2>
            <p className="text-cyan-100/60 text-center mb-16 max-w-2xl mx-auto">
              The brilliant minds behind CosmoLens AI
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:bg-white/10 hover:border-cyan-400/30 hover:-translate-y-1 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-cyan-500/15"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center border border-cyan-400/30 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-500/30">
                    <span className="text-xl font-semibold text-cyan-200">{member.initials}</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-xs text-cyan-100/60">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FINAL CTA                                                        */}
        {/* ================================================================ */}
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-3xl p-12 shadow-2xl shadow-cyan-500/10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Explore?</h2>
              <p className="text-cyan-100/70 mb-8 max-w-xl mx-auto">
                Begin your journey through the cosmos. Visualize celestial objects or predict planetary habitability
                with our physics-informed AI engine.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleLaunchExplorer}
                  className="h-14 px-10 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/50 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Open Explorer
                </Button>
                <Button
                  onClick={handleLaunchPlanetAI}
                  className="h-14 px-10 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Open Planet AI
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-white/10">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-cyan-100/40 text-sm">© 2026 CosmoLens AI. Exploring the universe, one star at a time.</p>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  )
}
