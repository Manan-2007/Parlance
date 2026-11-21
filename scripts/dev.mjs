import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const localPython = process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python'
const defaultPython = process.platform === 'win32' ? 'python' : 'python3'
const python = process.env.PARLANCE_PYTHON || (existsSync(new URL(`../${localPython}`, import.meta.url)) ? localPython : defaultPython)
const port = process.env.PARLANCE_API_PORT || '8000'
const children = []
let stopping = false

function stop(code) {
  if (stopping) return
  stopping = true
  process.exitCode = code
  for (const child of children) child.kill('SIGTERM')
}

function start(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', env: process.env })
  children.push(child)
  child.on('error', error => {
    console.error(error.message)
    stop(1)
  })
  child.on('exit', code => stop(code ?? 1))
}

start(python, ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', port, '--ws-max-size', '16384', '--ws-max-queue', '1'])
start(process.execPath, ['node_modules/vite/bin/vite.js'])
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
