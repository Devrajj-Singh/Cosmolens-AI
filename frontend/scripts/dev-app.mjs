import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { spawn } from "node:child_process"
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
const nextCliPath = path.join(frontendDir, "node_modules", "next", "dist", "bin", "next")

function getNodeExecutable() {
  if (bundledNodeExecutable && fs.existsSync(bundledNodeExecutable)) {
    return bundledNodeExecutable
  }

  return process.execPath
}

const child = spawn(
  getNodeExecutable(),
  [nextCliPath, "dev", "--hostname", "127.0.0.1", "--webpack"],
  {
    cwd: frontendDir,
    env: process.env,
    stdio: "inherit",
  },
)

child.on("error", (error) => {
  console.error(error)
  process.exit(1)
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
