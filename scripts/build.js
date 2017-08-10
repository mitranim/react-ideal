'use strict'

const {spawn} = require('child_process')
const args = require('yargs').option('skip', {describe: 'Skip cloning and installation'}).argv

async function main() {
  if (!args.skip) await cloneReact16()
  await buildForReact16()
}

function cloneReact16() {
  return spawnLinkP('bash', ['./scripts/clone16.sh'])
}

function buildForReact16() {
  return spawnLinkP('node', ['../../scripts/rollup16.js'], {cwd: './cloned/react16'})
}

function spawnLinkP () {
  return new Promise((resolve, reject) => {
    spawnLink(...arguments)
      .once('exit', code => {
        if (code) reject()
        else resolve()
      })
      .once('error', reject)
  })
}

function spawnLink () {
  const proc = spawn(...arguments)

  proc.stdin.pipe(process.stdin)
  proc.stdout.pipe(process.stdout)
  proc.stderr.pipe(process.stderr)

  function clear () {
    process.removeListener('exit', kill)
  }
  function kill () {
    clear()
    proc.kill()
  }
  process.once('exit', kill)
  proc.once('exit', clear)

  return proc
}

if (require.main === module) {
  main().catch(err => {
    if (err) console.error(err)
    process.exitCode = 1
  })
}
