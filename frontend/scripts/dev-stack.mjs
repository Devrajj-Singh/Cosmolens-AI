import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import process from "node:process"
import { spawn, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDir = path.resolve(__dirname, "..")
const repoRoot = path.resolve(frontendDir, "..")
const isWindows = process.platform === "win32"
const bundledNodeVersion = "v22.22.2"
const bundledNodeExecutable = isWindows
  ? path.join(repoRoot, ".tools", `node-${bundledNodeVersion}-win-x64`, "node.exe")
  : null
const bundledJavaHome = isWindows
  ? path.join(repoRoot, ".tools", "jdk-21.0.10+7-jre")
  : null
const pythonExecutable = isWindows
  ? path.join(repoRoot, ".venv", "Scripts", "python.exe")
  : path.join(repoRoot, ".venv", "bin", "python")
const pidFile = path.join(frontendDir, ".dev-stack-pids.json")

const defaultFrontendPort = 3101
const backendPort = 18010
const firebaseUiPort = 14100
const firestorePort = 18180
const authPort = 19199
const fixedPorts = [backendPort, firebaseUiPort, firestorePort, authPort]

const baseEnv = {
  ...process.env,
  FIREBASE_PROJECT_ID: "cosmolens-ai-local",
  FIRESTORE_EMULATOR_HOST: `127.0.0.1:${firestorePort}`,
  FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${authPort}`,
  AUTH_TOKEN_SECRET: "cosmolens-local-dev-secret",
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "cosmolens-ai-local.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "cosmolens-ai-local",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "cosmolens-ai-local.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:localdev",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: String(authPort),
  NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: "127.0.0.1",
  NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT: String(firestorePort),
  WATCHPACK_POLLING: "true",
}

const children = []
let shuttingDown = false

function log(message) {
  process.stdout.write(`[frontend-dev] ${message}\n`)
}

function loadPidFile() {
  try {
    return JSON.parse(fs.readFileSync(pidFile, "utf8"))
  } catch {
    return []
  }
}

function writePidFile() {
  const records = children
    .filter(({ child }) => Number.isInteger(child.pid))
    .map(({ name, child }) => ({ name, pid: child.pid }))
  fs.writeFileSync(pidFile, `${JSON.stringify(records, null, 2)}\n`)
}

function removePidFile() {
  try {
    fs.unlinkSync(pidFile)
  } catch {
    // Ignore missing pid file during shutdown.
  }
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function killProcessTree(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return

  if (isWindows) {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], { stdio: "ignore" })
    return
  }

  try {
    process.kill(-pid, "SIGTERM")
  } catch {
    try {
      process.kill(pid, "SIGTERM")
    } catch {
      return
    }
  }
}

function cleanupPreviousRun() {
  const previousChildren = loadPidFile()
  if (previousChildren.length === 0) return

  for (const { pid, name } of previousChildren) {
    if (!isPidAlive(pid)) continue
    killProcessTree(pid)
    log(`Stopped previous ${name} process (pid ${pid})`)
  }

  removePidFile()
}

function requireFile(filepath, description) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`${description} not found at ${filepath}`)
  }
}

function getNodeExecutable() {
  if (bundledNodeExecutable && fs.existsSync(bundledNodeExecutable)) {
    return bundledNodeExecutable
  }

  return process.execPath
}

function getFirebaseEnv() {
  if (!bundledJavaHome) {
    return {}
  }

  const javaExecutable = path.join(bundledJavaHome, "bin", isWindows ? "java.exe" : "java")
  if (!fs.existsSync(javaExecutable)) {
    return {}
  }

  const currentPath = process.env.PATH ?? ""
  const javaBin = path.join(bundledJavaHome, "bin")

  return {
    JAVA_HOME: bundledJavaHome,
    PATH: currentPath ? `${javaBin}${path.delimiter}${currentPath}` : javaBin,
  }
}

function startProcess(name, command, args, cwd, extraEnv = {}) {
  const spawnCommand = isWindows ? "cmd.exe" : command
  const spawnArgs = isWindows ? ["/d", "/s", "/c", command, ...args] : args
  const child = spawn(spawnCommand, spawnArgs, {
    cwd,
    env: { ...baseEnv, ...extraEnv },
    stdio: "inherit",
    detached: !isWindows,
  })

  child.on("error", (error) => {
    if (shuttingDown) return
    log(`${name} failed to start: ${error.message}`)
    shutdown(1)
  })

  child.on("exit", (code, signal) => {
    if (shuttingDown) return
    const detail = signal ? `signal ${signal}` : `code ${code ?? 0}`
    log(`${name} exited with ${detail}`)
    shutdown(code ?? 0)
  })

  children.push({ name, child })
  writePidFile()
  return child
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

async function assertFixedPortsAvailable() {
  for (const port of fixedPorts) {
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(port)
    if (!free) {
      throw new Error(`Port ${port} is already in use. Stop the conflicting process and try again.`)
    }
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  log("Stopping frontend, backend, and Firebase emulators...")
  removePidFile()

  for (const { child } of children) {
    if (child.pid) {
      killProcessTree(child.pid)
    }
  }

  setTimeout(() => {
    process.exit(exitCode)
  }, 1500)
}

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))
process.on("exit", removePidFile)

if (!process.env.npm_execpath) {
  log("Run this through npm so local scripts resolve correctly.")
  process.exit(1)
}

async function main() {
  requireFile(pythonExecutable, "Backend Python executable")
  cleanupPreviousRun()
  await assertFixedPortsAvailable()

  const frontendPort = await findFrontendPort(defaultFrontendPort)
  const frontendOrigin = `http://localhost:${frontendPort}`
  const backendUrl = `http://127.0.0.1:${backendPort}`

  log("Starting Firebase emulators...")
  startProcess(
    "firebase",
    "npx",
    ["firebase-tools@13.35.1", "emulators:start", "--only", "firestore,auth", "--project", "cosmolens-ai-local"],
    repoRoot,
    getFirebaseEnv(),
  )

  log("Starting backend...")
  startProcess(
    "backend",
    pythonExecutable,
    ["-m", "uvicorn", "backend.main:app", "--port", String(backendPort)],
    repoRoot,
    {
      FRONTEND_ORIGIN: frontendOrigin,
      NEXT_PUBLIC_BACKEND_URL: backendUrl,
    },
  )

  log("Starting frontend...")
  startProcess(
    "frontend",
    getNodeExecutable(),
    [
      path.join(frontendDir, "node_modules", "next", "dist", "bin", "next"),
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(frontendPort),
      "--webpack",
    ],
    frontendDir,
    {
      FRONTEND_ORIGIN: frontendOrigin,
      NEXT_PUBLIC_BACKEND_URL: backendUrl,
    },
  )

  log(`Frontend: ${frontendOrigin}`)
  log(`Backend: ${backendUrl}`)
  log(`Firebase UI: http://127.0.0.1:${firebaseUiPort}`)
}

main().catch((error) => {
  log(error instanceof Error ? error.message : "Failed to start local stack.")
  shutdown(1)
})
