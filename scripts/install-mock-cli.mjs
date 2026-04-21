import { access, chmod, copyFile, mkdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cliName = 'hello-world-cli'
const platform = process.platform
const arch = process.arch
const isWindows = platform === 'win32'
const binaryName = isWindows ? `${cliName}.exe` : cliName
const installDir =
  process.env.HELLO_WORLD_CLI_INSTALL_DIR ||
  path.join(os.homedir(), '.local', 'bin')
const installPath = path.join(installDir, binaryName)

const platformName = {
  darwin: 'macos',
  linux: 'linux',
  win32: 'windows',
}[platform]

const archName = {
  arm64: 'arm64',
  x64: 'x64',
}[arch]

if (!platformName || !archName) {
  console.error(`error: unsupported platform: ${platform}-${arch}`)
  process.exit(1)
}

const envBinary = process.env.HELLO_WORLD_CLI_BINARY
const packagedBinaryName = `${cliName}-${platformName}-${archName}${
  isWindows ? '.exe' : ''
}`
const sourceCandidates = [
  envBinary && path.resolve(envBinary),
  path.join(
    rootDir,
    'apps',
    'hello-world',
    'public',
    'downloads',
    packagedBinaryName
  ),
  path.join(rootDir, 'crates', 'hello-world-cli', 'target', 'release', binaryName),
].filter(Boolean)

async function exists(filePath) {
  try {
    await access(filePath, constants.R_OK)
    return true
  } catch {
    return false
  }
}

function pathEntries() {
  return (process.env.PATH || '')
    .split(path.delimiter)
    .filter(Boolean)
    .map((entry) => path.resolve(entry))
}

function isPathDirectoryConfigured(directory) {
  const resolvedDirectory = path.resolve(directory)

  if (isWindows) {
    return pathEntries().some(
      (entry) => entry.toLowerCase() === resolvedDirectory.toLowerCase()
    )
  }

  return pathEntries().includes(resolvedDirectory)
}

let sourcePath

for (const candidate of sourceCandidates) {
  if (await exists(candidate)) {
    sourcePath = candidate
    break
  }
}

if (!sourcePath) {
  console.error(
    `error: no prebuilt ${cliName} binary found for ${platformName}-${archName}`
  )
  console.error('looked for:')

  for (const candidate of sourceCandidates) {
    console.error(`  ${candidate}`)
  }

  console.error(`build the mock CLI first or set HELLO_WORLD_CLI_BINARY`)
  process.exit(1)
}

await mkdir(installDir, { recursive: true })
await copyFile(sourcePath, installPath)

if (!isWindows) {
  await chmod(installPath, 0o755)
}

console.log(`Installed ${cliName} to ${installPath}`)
console.log(`Source binary: ${sourcePath}`)

if (!isPathDirectoryConfigured(installDir)) {
  console.log(`${installDir} is not in PATH.`)
  console.log(`Add it to PATH before running ${cliName} directly.`)
}
