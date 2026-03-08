"use client"

import { useCosmoTheme } from "@/components/cosmo-theme-context"

export function CosmoBackground() {
  const { theme, activeModule } = useCosmoTheme()

  // Subtle parallax offset based on active module
  const parallaxX = activeModule === "explorer" ? "0%" : "-3%"
  const parallaxY = activeModule === "explorer" ? "0%" : "-1.5%"

  return (
    <>
      {theme === "nebula" && (
        <>
          <div
            className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 ease-in-out will-change-transform"
            style={{
              backgroundImage: `url('/deep-space-nebula-with-stars-purple-blue-cosmic-ga.jpg')`,
              transform: `translate(${parallaxX}, ${parallaxY}) scale(1.08)`,
            }}
          />
          <div className="fixed inset-0 bg-black/60" />
          <div
            className="fixed inset-0 overflow-hidden pointer-events-none transition-transform duration-700 ease-in-out will-change-transform"
            style={{
              transform: `translate(${activeModule === "explorer" ? "0px" : "-12px"}, ${activeModule === "explorer" ? "0px" : "-6px"})`,
            }}
          >
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${((i * 37 + 13) % 100)}%`,
                  top: `${((i * 53 + 7) % 100)}%`,
                  animationDelay: `${(i * 0.3) % 3}s`,
                  animationDuration: `${2 + (i % 3)}s`,
                  opacity: 0.3 + ((i % 5) * 0.14),
                }}
              />
            ))}
          </div>
        </>
      )}

      {theme === "spacePurple" && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 bg-gradient-to-br from-purple-950 via-violet-900/50 to-purple-950 transition-transform duration-700 ease-in-out will-change-transform"
            style={{
              transform: `translate(${parallaxX}, ${parallaxY}) scale(1.06)`,
            }}
          />
          <div
            className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-violet-600/20 rounded-full blur-3xl transition-transform duration-700 ease-in-out"
            style={{
              transform: `translate(${activeModule === "explorer" ? "0px" : "-20px"}, 0px)`,
            }}
          />
          <div
            className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-600/20 rounded-full blur-3xl transition-transform duration-700 ease-in-out"
            style={{
              transform: `translate(${activeModule === "explorer" ? "0px" : "20px"}, 0px)`,
            }}
          />
          <div
            className="absolute inset-0 transition-transform duration-700 ease-in-out will-change-transform"
            style={{
              transform: `translate(${activeModule === "explorer" ? "0px" : "-10px"}, ${activeModule === "explorer" ? "0px" : "-5px"})`,
            }}
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-violet-200 rounded-full animate-pulse"
                style={{
                  left: `${((i * 37 + 13) % 100)}%`,
                  top: `${((i * 53 + 7) % 100)}%`,
                  animationDelay: `${(i * 0.3) % 3}s`,
                  animationDuration: `${2 + (i % 3)}s`,
                  opacity: 0.2 + ((i % 5) * 0.1),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
