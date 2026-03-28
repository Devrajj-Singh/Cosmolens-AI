"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveSession } from "@/lib/auth/session"
import { loginWithEmail, signupWithEmail } from "@/lib/firebase/auth"
import { syncBackendSession } from "@/lib/api/auth"

export function LoginCard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailAuth = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const user =
        mode === "login"
          ? await loginWithEmail(email, password)
          : await signupWithEmail(email, password)

      const idToken = await user.getIdToken()
      const session = await syncBackendSession(idToken)
      saveSession(session)
      router.push(searchParams.get("redirect") || "/home")
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Authentication failed."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGuestLogin = () => {
    router.push("/home?auth=false")
  }

  return (
    <div className="relative z-10 w-full max-w-md mx-4">
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-purple-500/30 rounded-3xl blur-2xl opacity-60" />

      <div className="relative backdrop-blur-2xl bg-white/[0.08] border border-white/20 rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/40 via-blue-500/30 to-purple-500/40 opacity-60 blur-sm" />
        <div className="absolute inset-0 rounded-2xl bg-slate-900/50 backdrop-blur-xl" />

        <div className="relative">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            {/* Cosmic lens icon with enhanced glow */}
            <div className="mx-auto w-16 h-16 mb-4 relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-full blur-lg" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full" />
              </div>
              {/* Orbital ring */}
              <div
                className="absolute inset-0 border-2 border-cyan-400/50 rounded-full animate-spin"
                style={{ animationDuration: "8s" }}
              />
            </div>

            <h1 className="text-3xl font-bold text-white tracking-tight">CosmoLens AI</h1>
            <p className="text-cyan-300/80 text-sm mt-1 tracking-widest uppercase">Access Portal</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/70">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 border-white/15 bg-white/10 text-white placeholder:text-white/35"
                  placeholder="astronaut@cosmolens.ai"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/70">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 border-white/15 bg-white/10 text-white placeholder:text-white/35"
                  placeholder="Minimum 6 characters"
                />
              </div>
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
            </div>

            <Button
              onClick={handleEmailAuth}
              disabled={isSubmitting || email.trim() === "" || password.trim().length < 6}
              className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 hover:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/30 focus:ring-offset-0 active:scale-[0.98]"
              variant="ghost"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 mr-3 text-cyan-300 animate-spin" />
              ) : (
                <Mail className="w-5 h-5 mr-3 text-cyan-300" />
              )}
              {mode === "login" ? "Login with Email" : "Create Account"}
            </Button>

            <Button
              onClick={handleGuestLogin}
              className="w-full h-12 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/30 text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/35 hover:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/30 focus:ring-offset-0 active:scale-[0.98]"
              variant="ghost"
            >
              <User className="w-5 h-5 mr-3 text-cyan-300" />
              Continue as Guest
            </Button>
          </div>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setMode((current) => (current === "login" ? "signup" : "login"))
                  setError(null)
                }}
                className="text-cyan-400 hover:text-cyan-300 transition-all duration-200 underline underline-offset-2 hover:underline-offset-4"
              >
                {mode === "login" ? "Sign up" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
