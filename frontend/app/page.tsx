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
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Login card */}
      <LoginCard />
    </main>
  )
}
