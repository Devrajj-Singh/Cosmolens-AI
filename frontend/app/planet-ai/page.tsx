"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CosmoLayout } from "@/components/cosmo-layout"
import ExplorerContent from "@/app/explorer/explorer-content"
import PlanetAIContent from "./planet-ai-content"

function PlanetAIPageInner() {
  const searchParams = useSearchParams()
  const isAuth = searchParams.get("auth") !== "false"

  return (
    <CosmoLayout
      initialModule="planet-ai"
      initialAuth={isAuth}
      explorerContent={
        <Suspense fallback={null}>
          <ExplorerContent />
        </Suspense>
      }
      planetAIContent={<PlanetAIContent />}
    />
  )
}

export default function PlanetAIPage() {
  return (
    <Suspense>
      <PlanetAIPageInner />
    </Suspense>
  )
}
