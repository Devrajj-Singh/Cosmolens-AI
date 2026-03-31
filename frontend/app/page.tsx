"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Volume2, VolumeX } from "lucide-react"
import { LoginCard } from "@/components/login-card"
import { subscribeToAuthState } from "@/lib/firebase/auth"

function LoginPageInner() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    return subscribeToAuthState((user) => {
      if (user) {
        router.push("/home")
      }
    })
  }, [router])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.volume = 0.18
    video.muted = isMuted
    void video.play().catch(() => {})
  }, [isMuted])

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
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover blur-[6px] scale-105"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/space-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.2),_transparent_35%),linear-gradient(180deg,_rgba(2,6,23,0.55)_0%,_rgba(2,8,23,0.72)_100%)]" />

      <button
        type="button"
        onClick={toggleAudio}
        className="fixed right-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
        aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <LoginCard />
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
