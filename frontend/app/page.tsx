import { LoginCard } from "@/components/login-card"

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Deep space nebula background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/deep-space-nebula-with-stars-purple-blue-cosmic-ga.jpg')`,
        }}
      />

      {/* Blur and dark overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/60" />

      {/* Animated star particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
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

      {/* Login card */}
      <LoginCard />
    </main>
  )
}
