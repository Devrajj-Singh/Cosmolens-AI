import { spawn, spawnSync } from "node:child_process"
import net from "node:net"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDir = path.resolve(__dirname, "..")
const repoRoot = path.resolve(frontendDir, "..")
const venvPython = path.join(repoRoot, ".venv", "bin", "uvicorn")
const defaultFrontendPort = 3101

const baseEnv = {
  ...process.env,
  FIREBASE_PROJECT_ID: "cosmolens-ai-local",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:18180",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:19199",
  AUTH_TOKEN_SECRET: "cosmolens-local-dev-secret",
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "cosmolens-ai-local.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "cosmolens-ai-local",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "cosmolens-ai-local.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:localdev",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: "19199",
  NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: "127.0.0.1",
  NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT: "18180",
  WATCHPACK_POLLING: "true",
}

const children = []
let shuttingDown = false
const managedPorts = [3101, 18010, 14100, 18180, 19199]

function log(message) {
  process.stdout.write(`[frontend-dev] ${message}\n`)
}

function startProcess(name, command, args, cwd, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd,
    env: { ...baseEnv, ...extraEnv },
    stdio: "inherit",
  })

  child.on("exit", (code, signal) => {
    if (shuttingDown) return
    const detail = signal ? `signal ${signal}` : `code ${code ?? 0}`
    log(`${name} exited with ${detail}`)
    shutdown(code ?? 0)
  })

  children.push(child)
  return child
}

function freeManagedPorts() {
  for (const port of managedPorts) {
    const result = spawnSync(
      "bash",
      [
        "-lc",
        `PIDS=$(lsof -ti :${port} 2>/dev/null || true); if [ -n "$PIDS" ]; then kill $PIDS 2>/dev/null || true; fi`,
      ],
      { stdio: "ignore" },
    )

    if (result.status === 0) {
      log(`Cleared port ${port} before startup`)
    }
  }
}

function cleanupManagedProcesses() {
  const commands = [
    `pkill -f 'next dev --hostname 127.0.0.1 --port' 2>/dev/null || true`,
    `pkill -f 'uvicorn backend.main:app --port 18010' 2>/dev/null || true`,
    `pkill -f 'firebase-tools@13.35.1 emulators:start --only firestore,auth --project cosmolens-ai-local' 2>/dev/null || true`,
    `pkill -f 'cloud-firestore-emulator' 2>/dev/null || true`,
  ]

  for (const command of commands) {
    spawnSync("bash", ["-lc", command], { stdio: "ignore" })
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.unref()
    server.on("error", () => resolve(false))
    server.listen({ host: "127.0.0.1", port }, () => {
      server.close(() => resolve(true))
    })
  })
}

async function findFrontendPort(startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) {
      return port
    }
  }
  throw new Error(`No free frontend port found starting at ${startPort}`)
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  log("Stopping frontend, backend, and Firebase emulators...")
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM")
    }
  }
  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL")
      }
    }
    process.exit(exitCode)
  }, 1500)
}

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))

if (!process.env.npm_execpath) {
  log("Run this through npm so local scripts resolve correctly.")
  process.exit(1)
}

async function main() {
  cleanupManagedProcesses()
  freeManagedPorts()
  const frontendPort = await findFrontendPort(defaultFrontendPort)
  const frontendOrigin = `http://localhost:${frontendPort}`

  log("Starting Firebase emulators...")
  startProcess(
    "firebase",
    "npx",
    ["firebase-tools@13.35.1", "emulators:start", "--only", "firestore,auth", "--project", "cosmolens-ai-local"],
    repoRoot,
  )

  log("Starting backend...")
  startProcess(
    "backend",
    venvPython,
    ["backend.main:app", "--port", "18010"],
    repoRoot,
    {
      FRONTEND_ORIGIN: frontendOrigin,
      NEXT_PUBLIC_BACKEND_URL: "http://127.0.0.1:18010",
    },
  )

  log("Starting frontend...")
  startProcess(
    "frontend",
    "npx",
    ["next", "dev", "--hostname", "127.0.0.1", "--port", String(frontendPort), "--webpack"],
    frontendDir,
    {
      FRONTEND_ORIGIN: frontendOrigin,
      NEXT_PUBLIC_BACKEND_URL: "http://127.0.0.1:18010",
    },
  )

  log(`Frontend: ${frontendOrigin}`)
  log("Backend: http://127.0.0.1:18010")
  log("Firebase UI: http://127.0.0.1:14100")
}

main().catch((error) => {
  log(error instanceof Error ? error.message : "Failed to start local stack.")
  shutdown(1)
})
