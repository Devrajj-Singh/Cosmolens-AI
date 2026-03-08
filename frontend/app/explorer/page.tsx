"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CosmoLayout } from "@/components/cosmo-layout"
import ExplorerContent from "./explorer-content"
import PlanetAIContent from "@/app/planet-ai/planet-ai-content"

function ExplorerPageInner() {
  const searchParams = useSearchParams()
  const isAuth = searchParams.get("auth") !== "false"

  return (
    <CosmoLayout
      initialModule="explorer"
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

export default function ExplorerPage() {
  return (
    <Suspense>
      <ExplorerPageInner />
    </Suspense>
  )
}
