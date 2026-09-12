// Cross-platform `DEPLOY_TARGET=<x> vite build` without adding cross-env.
import { spawnSync } from 'node:child_process'

const target = process.argv[2] ?? 'local'
const r = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DEPLOY_TARGET: target },
})
process.exit(r.status ?? 1)
