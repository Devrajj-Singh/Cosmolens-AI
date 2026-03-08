"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, ZoomIn, Move, RefreshCw, Clock, StickyNote, ChevronDown, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCosmoTheme } from "@/components/cosmo-theme-context"
import { themeStyles } from "@/lib/themes"

const timelineData = [
  { year: "1835", event: "Discovered by John Herschel using an 18-inch reflector telescope" },
  { year: "1950", event: "Classified as SB(s)bc barred spiral by Hubble sequence" },
  { year: "2005", event: "Hubble Space Telescope captures high-resolution composite image" },
  { year: "2023", event: "James Webb Telescope infrared analysis reveals hidden star-forming regions" },
  { year: "2025", event: "CosmoLens AI deep learning model trained on 2.4M data points" },
]

const notesData = [
  "The central bar structure spans approximately 20,000 light-years and channels gas toward the nucleus, potentially fueling a dormant supermassive black hole.",
  "Spectral analysis indicates active star formation in the spiral arms, with H II regions emitting strong hydrogen-alpha wavelengths.",
  "The galaxy's relatively isolated position makes it an ideal candidate for studying unperturbed spiral dynamics.",
  "AI pattern recognition detects subtle asymmetry in the northern arm, suggesting a minor gravitational interaction ~500 million years ago.",
]

const objectData = {
  name: "NGC 1300",
  type: "Barred Spiral Galaxy",
  analysis:
    "NGC 1300 is a barred spiral galaxy located approximately 61 million light-years away in the constellation Eridanus. The galaxy is notable for its strongly defined bar structure, which contains a grand-design spiral pattern. AI analysis reveals complex dust lanes and active star-forming regions within the spiral arms.",
  properties: [
    { label: "Distance", value: "61 million ly" },
    { label: "Type", value: "SB(s)bc" },
    { label: "Constellation", value: "Eridanus" },
    { label: "Diameter", value: "110,000 ly" },
    { label: "Discovered", value: "1835" },
    { label: "Agency", value: "ESA/NASA" },
  ],
}

export default function ExplorerContent() {
  const { theme, isAuthenticated } = useCosmoTheme()
  const router = useRouter()
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const styles = themeStyles[theme]

  return (
    <div className="p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Galaxy Visualization Card */}
          <div
            className={`relative flex-1 rounded-2xl border p-6 ${styles.cardBg} transition-all duration-300 shadow-xl ${theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/10"}`}
          >
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center py-4">
                <div className="relative">
                  <div
                    className={`absolute -inset-4 rounded-full blur-xl ${theme === "spacePurple" ? "bg-gradient-to-r from-violet-500/20 to-blue-500/20 shadow-violet-500/30" : theme === "dark" ? "bg-gradient-to-r from-[#7c7cff]/20 to-blue-500/20" : `bg-gradient-to-r from-cyan-500/20 to-blue-500/20 ${styles.glowColor}`}`}
                  />
                  <div
                    className={`relative w-72 h-72 lg:w-80 lg:h-80 rounded-full border-2 ${
                      theme === "light"
                        ? "border-slate-300 bg-slate-100"
                        : theme === "spacePurple"
                          ? "border-violet-500/30 bg-purple-950/50"
                          : theme === "dark"
                            ? "border-[#7c7cff]/30 bg-[#050507]/50"
                            : "border-cyan-500/30 bg-slate-900/50"
                    } flex items-center justify-center overflow-hidden`}
                  >
                    <div className="absolute inset-8 rounded-full overflow-hidden">
                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: "30s" }}>
                        <div
                          className={`absolute inset-0 rounded-full blur-sm ${theme === "spacePurple" ? "bg-gradient-conic from-violet-500/40 via-blue-500/20 to-violet-500/40" : theme === "dark" ? "bg-gradient-conic from-[#7c7cff]/40 via-purple-500/20 to-[#7c7cff]/40" : "bg-gradient-conic from-cyan-500/40 via-purple-500/20 to-cyan-500/40"}`}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg shadow-yellow-500/50" />
                      </div>
                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: "20s" }}>
                        {Array.from({ length: 100 }).map((_, i) => {
                          const angle = (i / 100) * Math.PI * 4
                          const radius = 20 + (i / 100) * 100
                          const x = Math.cos(angle) * radius + 128
                          const y = Math.sin(angle) * radius + 128
                          return (
                            <div
                              key={i}
                              className={`absolute w-1 h-1 rounded-full ${theme === "spacePurple" ? "bg-violet-300/60" : theme === "dark" ? "bg-[#a5a5ff]/60" : "bg-cyan-300/60"}`}
                              style={{
                                left: `${(x / 256) * 100}%`,
                                top: `${(y / 256) * 100}%`,
                                opacity: 0.3 + ((i * 7) % 10) * 0.07,
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                    <span className={`absolute top-4 left-4 text-xs ${styles.textMuted}`}>WebGL</span>
                    <span className={`absolute top-4 right-4 text-xs ${styles.textMuted}`}>3D</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 mt-4">
                {[
                  { icon: RotateCcw, label: "Rotate" },
                  { icon: ZoomIn, label: "Zoom" },
                  { icon: Move, label: "Pan" },
                  { icon: RefreshCw, label: "Reset" },
                ].map((btn) => (
                  <Button
                    key={btn.label}
                    variant="ghost"
                    className={`${styles.buttonBg} border gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95`}
                  >
                    <btn.icon className="w-4 h-4" />
                    <span className={styles.textPrimary}>{btn.label}</span>
                  </Button>
                ))}
              </div>

              <p className={`text-center text-xs mt-4 ${styles.textMuted}`}>AI Model Ready - WebGL Interactive</p>
            </div>

            {/* Guest Mode: 3D model locked overlay */}
            {!isAuthenticated && (
              <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden animate-in fade-in-0 duration-500">
                <div className="absolute inset-0 backdrop-blur-[6px] bg-black/40" />
                <div className="relative h-full flex items-center justify-center p-6">
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
                    <h3 className={`text-lg font-semibold mb-2 ${styles.textPrimary}`}>Login required for interactive visualization</h3>
                    <p className={`text-sm leading-relaxed mb-5 ${styles.textMuted}`}>
                      Sign in to unlock full 3D exploration and AI-powered analysis tools.
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
                      Login to Continue
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subtle Data Info Strip */}
          <div
            className={`flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2.5 rounded-lg border ${styles.cardBg} transition-all duration-300`}
          >
            {[
              { label: "Data Source", value: "Curated Astronomical Dataset" },
              { label: "Visualization Engine", value: "WebGL Renderer" },
              { label: "Last Updated", value: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`text-[11px] uppercase tracking-wider ${styles.textMuted}`}>{item.label}:</span>
                <span className={`text-[11px] font-medium ${styles.textSecondary}`}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Timeline & Notes - Two Collapsible Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeline Card */}
            <div
              className={`rounded-2xl border ${styles.cardBg} transition-all duration-300 shadow-lg ${
                theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/5"
              }`}
            >
              <button
                onClick={() => setTimelineOpen(!timelineOpen)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors duration-200 rounded-2xl ${
                  theme === "light" ? "hover:bg-slate-50" : theme === "dark" ? "hover:bg-[#101218]/60" : theme === "spacePurple" ? "hover:bg-violet-800/20" : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className={`w-4 h-4 ${styles.accent}`} />
                  <span className={`text-sm font-semibold ${styles.textSecondary}`}>Timeline</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${styles.textMuted} ${timelineOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: timelineOpen ? "500px" : "0px",
                  opacity: timelineOpen ? 1 : 0,
                }}
              >
                <div className="px-5 pb-5 pt-1">
                  <div className="relative">
                    {/* Vertical connector line */}
                    <div
                      className={`absolute left-[29px] top-2 bottom-2 w-px ${
                        theme === "light" ? "bg-slate-200" : theme === "dark" ? "bg-[#1a1c22]" : theme === "spacePurple" ? "bg-violet-500/15" : "bg-white/10"
                      }`}
                    />
                    <div className="space-y-4">
                      {timelineData.map((item, index) => (
                        <div key={index} className="flex gap-4 items-start relative">
                          <span className={`text-sm font-mono font-semibold ${styles.accent} min-w-[60px] relative z-10`}>
                            {item.year}
                          </span>
                          <span className={`text-sm leading-relaxed ${styles.textSecondary}`}>{item.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div
              className={`rounded-2xl border ${styles.cardBg} transition-all duration-300 shadow-lg ${
                theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/5"
              }`}
            >
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors duration-200 rounded-2xl ${
                  theme === "light" ? "hover:bg-slate-50" : theme === "dark" ? "hover:bg-[#101218]/60" : theme === "spacePurple" ? "hover:bg-violet-800/20" : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <StickyNote className={`w-4 h-4 ${styles.accent}`} />
                  <span className={`text-sm font-semibold ${styles.textSecondary}`}>Notes</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${styles.textMuted} ${notesOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: notesOpen ? "500px" : "0px",
                  opacity: notesOpen ? 1 : 0,
                }}
              >
                <div className="px-5 pb-5 pt-1">
                  <div className="space-y-4">
                    {notesData.map((note, index) => (
                      <div key={index}>
                        <div className="flex gap-3 items-start">
                          <span className={`text-sm font-semibold ${styles.accent} shrink-0`}>{"•"}</span>
                          <p className={`text-sm leading-relaxed ${styles.textSecondary}`}>{note}</p>
                        </div>
                        {index < notesData.length - 1 && (
                          <div
                            className={`mt-4 border-b ${
                              theme === "light" ? "border-slate-100" : theme === "dark" ? "border-[#1a1c22]/60" : theme === "spacePurple" ? "border-violet-500/10" : "border-white/5"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Object Info */}
        <div className="flex flex-col gap-4">
          <div
            className={`rounded-2xl border p-6 ${styles.cardBg} transition-all duration-300 shadow-xl ${theme === "dark" ? "shadow-[#7c7cff]/5" : "shadow-cyan-500/10"}`}
          >
            <div className="space-y-4">
              <div>
                <h2 className={`text-2xl font-bold ${styles.textPrimary}`}>{objectData.name}</h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${styles.accentBg}`}>
                  {objectData.type}
                </span>
              </div>

              <div>
                <h3 className={`text-sm font-semibold mb-2 ${styles.textSecondary}`}>AI Analysis</h3>
                <p className={`text-sm leading-relaxed ${styles.textSecondary}`}>{objectData.analysis}</p>
              </div>

              <div>
                <h3 className={`text-sm font-semibold mb-3 ${styles.textSecondary}`}>Key Properties</h3>
                <div className="space-y-2">
                  {objectData.properties.map((prop) => (
                    <div
                      key={prop.label}
                      className={`flex justify-between py-2 border-b ${
                        theme === "light"
                          ? "border-slate-200"
                          : theme === "dark"
                            ? "border-[#1a1c22]"
                            : "border-white/10"
                      }`}
                    >
                      <span className={`text-sm ${styles.textMuted}`}>{prop.label}</span>
                      <span className={`text-sm font-medium ${styles.textPrimary}`}>{prop.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}
