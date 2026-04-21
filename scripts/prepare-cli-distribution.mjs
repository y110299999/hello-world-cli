import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { platform, arch } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const targetDir = path.join(
  rootDir,
  'apps',
  'hello-world',
  'src-tauri',
  'target'
)
const outputDirs = [
  path.join(rootDir, 'apps', 'hello-world', 'dist', 'downloads'),
  path.join(rootDir, 'apps', 'hello-world', 'public', 'downloads'),
]
const hostPlatform = platform()
const hostArch = arch()

const toPosixPath = (value) => value.split(path.sep).join('/')
const isAppImage = (value) => value.endsWith('.AppImage')
const isGenericLinuxAppImage = (value) =>
  value.startsWith('release/bundle/appimage/') && isAppImage(value)

const rules = [
  {
    label: 'macOS DMG',
    outputName: 'HelloWorld-macos.dmg',
    matches: (value) =>
      value.includes('/release/bundle/dmg/') && value.endsWith('.dmg'),
  },
  {
    label: 'Windows x64 MSI',
    outputName: 'HelloWorld-windows-x64.msi',
    matches: (value) =>
      value.includes('/release/bundle/msi/') && value.endsWith('.msi'),
  },
  {
    label: 'Linux x64 AppImage',
    outputName: 'HelloWorld-linux-x64.AppImage',
    matches: (value) =>
      (value.includes(
        '/x86_64-unknown-linux-gnu/release/bundle/appimage/'
      ) &&
        isAppImage(value)) ||
      (hostPlatform === 'linux' &&
        hostArch === 'x64' &&
        isGenericLinuxAppImage(value)),
  },
  {
    label: 'Linux arm64 AppImage',
    outputName: 'HelloWorld-linux-arm64.AppImage',
    matches: (value) =>
      (value.includes(
        '/aarch64-unknown-linux-gnu/release/bundle/appimage/'
      ) &&
        isAppImage(value)) ||
      (hostPlatform === 'linux' &&
        hostArch === 'arm64' &&
        isGenericLinuxAppImage(value)),
  },
]

async function listFiles(dir) {
  let entries

  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return []
    }

    throw error
  }

  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)))
      continue
    }

    if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

async function copyLatest({ label, outputName, matches }, files) {
  const sourcePath = files
    .filter((file) => matches(toPosixPath(path.relative(targetDir, file))))
    .sort((a, b) => a.localeCompare(b))
    .at(-1)

  if (!sourcePath) {
    console.log(`Skipped ${label}: no artifact found`)
    return 0
  }

  for (const outputDir of outputDirs) {
    await mkdir(outputDir, { recursive: true })
    await copyFile(sourcePath, path.join(outputDir, outputName))
  }

  console.log(`Prepared ${label}: ${path.join(outputDirs[0], outputName)}`)
  return 1
}

const files = await listFiles(targetDir)
let copiedCount = 0

for (const rule of rules) {
  copiedCount += await copyLatest(rule, files)
}

if (copiedCount === 0) {
  console.error(`error: no distribution artifacts found in ${targetDir}`)
  process.exit(1)
}
