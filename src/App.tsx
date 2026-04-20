import { useEffect, useMemo, useRef, useState } from 'react'

const APP_URL = 'hello-world://open'
const OPEN_TIMEOUT_MS = 1800

type Platform = 'macos' | 'windows' | 'linux' | 'unknown'
type OpenState = 'idle' | 'trying' | 'fallback'

type Installer = {
  platform: Exclude<Platform, 'unknown'>
  label: string
  href: string
  hint: string
}

const INSTALLERS: Installer[] = [
  {
    platform: 'macos',
    label: '下载 macOS 版',
    href: '/downloads/HelloTauri-macos.dmg',
    hint: '下载 DMG 后拖到 Applications。',
  },
  {
    platform: 'windows',
    label: '下载 Windows 版',
    href: '/downloads/HelloTauri-windows-x64.msi',
    hint: '下载 MSI 后按安装向导完成安装。',
  },
  {
    platform: 'linux',
    label: '下载 Linux 版',
    href: '/downloads/HelloTauri-linux-x64.AppImage',
    hint: '下载 AppImage 后添加执行权限再打开。',
  },
]

const PLATFORM_LABELS: Record<Platform, string> = {
  macos: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
  unknown: '未知系统',
}

function detectPlatform(): Platform {
  const platform = `${navigator.platform} ${navigator.userAgent}`.toLowerCase()

  if (platform.includes('mac')) return 'macos'
  if (platform.includes('win')) return 'windows'
  if (platform.includes('linux') || platform.includes('x11')) return 'linux'

  return 'unknown'
}

function sortInstallers(platform: Platform) {
  if (platform === 'unknown') return INSTALLERS

  return [
    ...INSTALLERS.filter((installer) => installer.platform === platform),
    ...INSTALLERS.filter((installer) => installer.platform !== platform),
  ]
}

export default function App() {
  const [openState, setOpenState] = useState<OpenState>('idle')
  const timeoutRef = useRef<number | undefined>(undefined)
  const attemptRef = useRef(false)
  const platform = useMemo(detectPlatform, [])
  const installers = useMemo(() => sortInstallers(platform), [platform])

  useEffect(() => {
    const clearOpenTimeout = () => {
      if (timeoutRef.current === undefined) return

      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    const markOpened = () => {
      if (!attemptRef.current) return

      attemptRef.current = false
      clearOpenTimeout()
      setOpenState('idle')
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        markOpened()
      }
    }

    window.addEventListener('pagehide', markOpened)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearOpenTimeout()
      window.removeEventListener('pagehide', markOpened)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const openHelloWorld = () => {
    attemptRef.current = true
    setOpenState('trying')

    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current)
    }

    window.location.href = APP_URL

    timeoutRef.current = window.setTimeout(() => {
      if (!attemptRef.current || document.visibilityState === 'hidden') return

      attemptRef.current = false
      setOpenState('fallback')
      timeoutRef.current = undefined
    }, OPEN_TIMEOUT_MS)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: 16 }}>首页</h1>
        <button
          type="button"
          onClick={openHelloWorld}
          disabled={openState === 'trying'}
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            border: '1px solid #111',
            borderRadius: 8,
            background: '#fff',
            color: '#111',
            cursor: openState === 'trying' ? 'default' : 'pointer',
            font: 'inherit',
            opacity: openState === 'trying' ? 0.7 : 1,
          }}
        > 进入 Hello World
        </button>

        {openState === 'fallback' ? (
          <div style={{ marginTop: 18 }}>
            <p style={{ margin: '0 0 8px' }}>
              没有检测到 Hello World 被打开。
            </p>
            <p style={{ margin: '0 0 8px' }}>
              如果浏览器正在询问，请选择打开；如果还没安装，请下载安装包。
            </p>
            <p style={{ margin: '0 0 14px' }}>
              当前系统：{PLATFORM_LABELS[platform]}。请选择对应安装包。
            </p>
            <div
              style={{
                display: 'grid',
                gap: 10,
                justifyItems: 'center',
              }}
            >
              {installers.map((installer) => (
                <a
                  key={installer.href}
                  href={installer.href}
                  download
                  title={installer.hint}
                  style={{
                    display: 'inline-block',
                    minWidth: 220,
                    padding: '10px 16px',
                    border: '1px solid #111',
                    borderRadius: 8,
                    color: '#fff',
                    background: '#111',
                    textDecoration: 'none',
                  }}
                >
                  {installer.label}
                </a>
              ))}
            </div>
          
          </div>
        ) : null}
      </section>
    </main>
  )
}
