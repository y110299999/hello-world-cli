function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

const DEV_DISTRIBUTION_ORIGIN = 'http://localhost:1420'

const DISTRIBUTION_ORIGIN = trimTrailingSlash(
  import.meta.env.VITE_HELLO_WORLD_DISTRIBUTION_ORIGIN ||
    DEV_DISTRIBUTION_ORIGIN
)
const INSTALL_SCRIPT_URL = trimTrailingSlash(
  import.meta.env.VITE_HELLO_WORLD_INSTALL_SCRIPT_URL ||
    `${DISTRIBUTION_ORIGIN}/install-cli.sh`
)
const WINDOWS_INSTALL_SCRIPT_URL = trimTrailingSlash(
  import.meta.env.VITE_HELLO_WORLD_WINDOWS_INSTALL_SCRIPT_URL ||
    `${DISTRIBUTION_ORIGIN}/install-cli.ps1`
)
const DOWNLOAD_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_HELLO_WORLD_DOWNLOAD_BASE_URL ||
    `${DISTRIBUTION_ORIGIN}/downloads`
)

const codeStyle: React.CSSProperties = {
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
}

export default function App() {
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
      <section style={{ textAlign: 'center', maxWidth: 640, padding: '0 16px' }}>
        <h1 style={{ marginBottom: 8 }}>Hello World CLI</h1>
        <p style={{ margin: '0 0 24px', color: '#555' }}>
          在终端运行以下命令安装 CLI：
        </p>

        <p style={{ margin: '0 0 8px', fontWeight: 500 }}>macOS / Linux</p>
        <code style={codeStyle}>
          {`curl -fsSL ${INSTALL_SCRIPT_URL} | bash -s -- ${DOWNLOAD_BASE_URL}`}
        </code>

        <p style={{ margin: '24px 0 8px', fontWeight: 500 }}>Windows (PowerShell)</p>
        <code style={codeStyle}>
          {`powershell -c "$env:HELLO_WORLD_CLI_DOWNLOAD_BASE_URL='${DOWNLOAD_BASE_URL}'; irm ${WINDOWS_INSTALL_SCRIPT_URL} | iex"`}
        </code>

        <p style={{ margin: '24px 0 8px', color: '#555' }}>安装完成后运行：</p>
        <code style={codeStyle}>hello-world-cli hello</code>
      </section>
    </main>
  )
}
