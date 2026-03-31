"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

type PlanetModelViewerProps = {
  modelPath: string
  modelLabel: string
}

export type PlanetModelViewerHandle = {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

export const PlanetModelViewer = forwardRef<PlanetModelViewerHandle, PlanetModelViewerProps>(function PlanetModelViewer({
  modelPath,
  modelLabel,
}: PlanetModelViewerProps, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const viewerActionsRef = useRef<PlanetModelViewerHandle>({
    zoomIn: () => {},
    zoomOut: () => {},
    resetView: () => {},
  })

  useImperativeHandle(ref, () => viewerActionsRef.current, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    setStatus("loading")
    setErrorMessage("")

    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#020817")
    scene.fog = new THREE.Fog("#020817", 18, 40)

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    )
    camera.position.set(0, 1.5, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.innerHTML = ""
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = true
    controls.enableZoom = true
    controls.enableRotate = true
    controls.minDistance = 2
    controls.maxDistance = 12

    const hemisphereLight = new THREE.HemisphereLight("#c4f1ff", "#020617", 2.4)
    const ambientLight = new THREE.AmbientLight("#ffffff", 2.2)
    const keyLight = new THREE.DirectionalLight("#ffffff", 3.5)
    keyLight.position.set(4, 5, 6)
    const rimLight = new THREE.DirectionalLight("#7dd3fc", 2.5)
    rimLight.position.set(-5, 2, -4)
    const fillLight = new THREE.PointLight("#f8fafc", 15, 40)
    fillLight.position.set(0, -2, 4)

    scene.add(hemisphereLight, ambientLight, keyLight, rimLight, fillLight)

    const stars = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: "#cbd5e1",
        size: 0.05,
        transparent: true,
        opacity: 0.8,
      }),
    )

    const starCount = 1200
    const starPositions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i += 1) {
      const stride = i * 3
      starPositions[stride] = (Math.random() - 0.5) * 50
      starPositions[stride + 1] = (Math.random() - 0.5) * 50
      starPositions[stride + 2] = (Math.random() - 0.5) * 50
    }
    stars.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3),
    )
    scene.add(stars)

    const loader = new GLTFLoader()
    let frameId = 0
    let disposed = false
    let loadedModel: any = null
    let initialCameraPosition = camera.position.clone()
    let initialControlsTarget = controls.target.clone()
    let initialMinDistance = controls.minDistance
    let initialMaxDistance = controls.maxDistance
    let initialScale = 1

    const resizeRenderer = () => {
      if (!container) {
        return
      }

      const width = container.clientWidth
      const height = container.clientHeight

      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    const frameModel = (object: any) => {
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z) || 1
      const targetSize = 3.2
      const uniformScale = targetSize / maxDimension

      object.scale.setScalar(uniformScale)

      const scaledBox = new THREE.Box3().setFromObject(object)
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3())
      const scaledSize = scaledBox.getSize(new THREE.Vector3())
      const scaledMaxDimension = Math.max(scaledSize.x, scaledSize.y, scaledSize.z) || 1

      object.position.sub(scaledCenter)

      camera.position.set(scaledMaxDimension * 0.25, scaledMaxDimension * 0.45, scaledMaxDimension * 2.6)
      camera.near = 0.1
      camera.far = Math.max(scaledMaxDimension * 30, 100)
      camera.updateProjectionMatrix()

      controls.target.set(0, 0, 0)
      controls.minDistance = Math.max(scaledMaxDimension * 0.9, 1.5)
      controls.maxDistance = Math.max(scaledMaxDimension * 8, 10)
      controls.update()

      initialCameraPosition = camera.position.clone()
      initialControlsTarget = controls.target.clone()
      initialMinDistance = controls.minDistance
      initialMaxDistance = controls.maxDistance
      initialScale = object.scale.x
    }

    const zoomModel = (multiplier: number) => {
      if (!loadedModel) return

      const nextScale = THREE.MathUtils.clamp(loadedModel.scale.x * multiplier, initialScale * 0.5, initialScale * 2.5)
      loadedModel.scale.setScalar(nextScale)
    }

    const resetView = () => {
      if (!loadedModel) return

      loadedModel.rotation.set(0, 0, 0)
      loadedModel.scale.setScalar(initialScale)
      camera.position.copy(initialCameraPosition)
      controls.target.copy(initialControlsTarget)
      controls.minDistance = initialMinDistance
      controls.maxDistance = initialMaxDistance
      controls.update()
    }

    Object.assign(viewerActionsRef.current, {
      zoomIn: () => zoomModel(1.15),
      zoomOut: () => zoomModel(0.87),
      resetView,
    })

    loader.load(
      modelPath,
      (gltf: any) => {
        if (disposed) {
          return
        }

        loadedModel = gltf.scene
        loadedModel.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false
            child.receiveShadow = false

            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material]
              for (const material of materials) {
                if ("metalness" in material && typeof material.metalness === "number") {
                  material.metalness = Math.min(material.metalness, 0.35)
                }
                if ("roughness" in material && typeof material.roughness === "number") {
                  material.roughness = Math.max(material.roughness, 0.45)
                }
                material.needsUpdate = true
              }
            }
          }
        })

        scene.add(gltf.scene)
        frameModel(gltf.scene)
        console.log(`Loaded 3D model: ${modelPath}`)
        setStatus("ready")
      },
      undefined,
      (error: unknown) => {
        if (disposed) {
          return
        }

        console.error(`Failed to load model: ${modelPath}`, error)
        setStatus("error")
        setErrorMessage(
          error instanceof Error
            ? error.message
            : `Unable to load ${modelLabel}. Check that the model exists at ${modelPath}.`,
        )
      },
    )

    const animate = () => {
      frameId = window.requestAnimationFrame(animate)

      if (loadedModel) {
        loadedModel.rotation.y += 0.003
      }

      stars.rotation.y += 0.0004
      controls.update()
      renderer.render(scene, camera)
    }

    animate()
    resizeRenderer()
    window.addEventListener("resize", resizeRenderer)

    return () => {
      disposed = true
      window.cancelAnimationFrame(frameId)
      window.removeEventListener("resize", resizeRenderer)
      controls.dispose()

      scene.traverse((object: any) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]

          for (const material of materials) {
            const textureKeys = [
              "map",
              "normalMap",
              "roughnessMap",
              "metalnessMap",
              "emissiveMap",
              "aoMap",
              "alphaMap",
              "bumpMap",
            ] as const

            for (const key of textureKeys) {
              const texture = material[key]
              if (texture instanceof THREE.Texture) {
                texture.dispose()
              }
            }

            material.dispose()
          }
        }
      })

      stars.geometry.dispose()
      ;(stars.material as any).dispose()
      renderer.dispose()
      container.innerHTML = ""
    }
  }, [modelLabel, modelPath])

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-cyan-950/20 lg:h-[560px]">
      <div
        ref={containerRef}
        className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_35%)]"
      />

      {status !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="max-w-sm px-6 text-center text-sm text-slate-200">
            <p className="font-medium tracking-[0.2em] uppercase">
              {status === "loading" ? "Loading model" : "Load failed"}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {status === "loading"
                ? `Preparing the ${modelLabel} model from /public/models.`
                : errorMessage}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
})
