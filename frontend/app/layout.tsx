import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CosmoLens AI - Explorer & Planet AI",
  description: "Explore the cosmos and predict planet habitability with AI-powered tools",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const shouldEnableAnalytics = process.env.NODE_ENV === "production"

  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        {children}
        {shouldEnableAnalytics ? <Analytics /> : null}
      </body>
    </html>
  )
}
