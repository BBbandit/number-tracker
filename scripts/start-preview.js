/* global process */
import { spawn } from 'node:child_process'
import { mkdirSync, openSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const logDir = path.join(rootDir, 'runtime-logs')

mkdirSync(logDir, { recursive: true })

const out = openSync(path.join(logDir, 'preview.out.log'), 'a')
const err = openSync(path.join(logDir, 'preview.err.log'), 'a')

const command =
  process.platform === 'win32'
    ? 'npm.cmd run preview -- --host 0.0.0.0 --port 4174'
    : 'npm run preview -- --host 0.0.0.0 --port 4174'

const child = spawn(command, {
  cwd: rootDir,
  detached: true,
  shell: true,
  stdio: ['ignore', out, err],
})

child.unref()

console.log(`preview-started:${child.pid}`)
