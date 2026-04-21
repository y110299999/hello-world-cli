import { access, copyFile, mkdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { arch, platform } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cliName = 'hello-world-cli'
const isWindows = platform() === 'win32'
const platformName = {
  darwin: 'macos',
  linux: 'linux',
  win32: 'windows',
}[platform()]
const archName = {
  arm64: 'arm64',
  x64: 'x64',
}[arch()]

if (!platformName || !archName) {
  console.error(`error: unsupported platform: ${platform()}-${arch()}`)
  process.exit(1)
}

const binaryName = isWindows ? `${cliName}.exe` : cliName
const outputName = `${cliName}-${platformName}-${archName}${
  isWindows ? '.exe' : ''
}`
const sourcePath =
  process.env.HELLO_WORLD_CLI_BINARY ||
  path.join(rootDir, 'crates', cliName, 'target', 'release', binaryName)
const outputDirs = [
  path.join(rootDir, 'apps', 'hello-world', 'public', 'downloads'),
  path.join(rootDir, 'apps', 'hello-world', 'dist', 'downloads'),
]
const publicFiles = ['install-cli.sh', 'install-cli.ps1']

async function exists(filePath) {
  try {
    await access(filePath, constants.R_OK)
    return true
  } catch {
    return false
  }
}

if (!(await exists(sourcePath))) {
  console.error(`error: prebuilt mock CLI binary not found: ${sourcePath}`)
  console.error('build it first, or set HELLO_WORLD_CLI_BINARY=/path/to/binary')
  process.exit(1)
}

for (const outputDir of outputDirs) {
  await mkdir(outputDir, { recursive: true })
  await copyFile(sourcePath, path.join(outputDir, outputName))
  console.log(`Prepared mock CLI binary: ${path.join(outputDir, outputName)}`)
}

const distDir = path.join(rootDir, 'apps', 'hello-world', 'dist')

if (await exists(distDir)) {
  for (const file of publicFiles) {
    await copyFile(
      path.join(rootDir, 'apps', 'hello-world', 'public', file),
      path.join(distDir, file)
    )
  }
}
