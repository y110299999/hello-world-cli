import { useEffect, useMemo, useRef, useState } from 'react'

const APP_URL = 'hello-world://open'
const OPEN_TIMEOUT_MS = 1000

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}



function getInstallCommand() {
  const installScriptUrl = import.meta.env.VITE_HELLO_WORLD_INSTALL_SCRIPT_URL
  const downloadBaseUrl = import.meta.env.VITE_HELLO_WORLD_DOWNLOAD_BASE_URL
  const origin = trimTrailingSlash(import.meta.env.VITE_HELLO_WORLD_DISTRIBUTION_ORIGIN )

  return `curl -fsSL ${installScriptUrl || `${trimTrailingSlash(origin)}/install.sh`} | bash -s -- ${trimTrailingSlash(downloadBaseUrl || `${origin}/downloads`)}`
}

type OpenState = 'idle' | 'trying' | 'fallback'

export default function App() {
  const [openState, setOpenState] = useState<OpenState>('idle')
  const timeoutRef = useRef<number | undefined>(undefined)
  const attemptRef = useRef(false)
  const appUrl = useMemo(() => (import.meta.env.VITE_HELLO_WORLD_DISTRIBUTION_ORIGIN ), [])
  const installCommand = useMemo(getInstallCommand, [])

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

    window.addEventListener('blur', markOpened)
    window.addEventListener('pagehide', markOpened)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearOpenTimeout()
      window.removeEventListener('blur', markOpened)
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
      if (
        !attemptRef.current ||
        !document.hasFocus() ||
        document.visibilityState === 'hidden'
      ) {
        return
      }

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
        >
          进入 Hello World
        </button>

        {openState === 'fallback' ? (
          <div style={{ marginTop: 18 }}>
            <p style={{ margin: '0 0 8px' }}>
              没有检测到 Hello World 被打开。
            </p>

            <p style={{ margin: '0 0 14px' }}>
              在终端运行安装命令后再试。
            </p>
            <code
              style={{
                display: 'inline-block',
                maxWidth: 'calc(100vw - 32px)',
                padding: '10px 12px',
                border: '1px solid #111',
                borderRadius: 8,
                background: '#f7f7f7',
                color: '#111',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                fontSize: 14,
                whiteSpace: 'normal',
                wordBreak: 'break-all',
              }}
            >
              {installCommand}
            </code>
          </div>
        ) : null}
      </section>
    </main>
  )
}
