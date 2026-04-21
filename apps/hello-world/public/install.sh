#!/usr/bin/env bash
set -euo pipefail

APP_NAME="HelloWorld"
APP_DISPLAY_NAME="Hello World"
APP_COMMAND="hello-world"
APP_PROTOCOL_URL="hello-world://open"
APP_PROTOCOL_SCHEME="hello-world"
DOWNLOAD_BASE_URL="${1:-${HELLO_WORLD_DOWNLOAD_BASE_URL:-}}"

[[ -n "${DOWNLOAD_BASE_URL}" ]] || {
  printf 'error: missing download base url\n' >&2
  printf 'usage: curl -fsSL http://localhost:1420/install.sh | bash -s -- http://localhost:1420/downloads\n' >&2
  exit 1
}

DOWNLOAD_BASE_URL="${DOWNLOAD_BASE_URL%/}"

MACOS_DMG_URL="${DOWNLOAD_BASE_URL}/HelloWorld-macos.dmg"
LINUX_X64_APPIMAGE_URL="${DOWNLOAD_BASE_URL}/HelloWorld-linux-x64.AppImage"
LINUX_ARM64_APPIMAGE_URL="${DOWNLOAD_BASE_URL}/HelloWorld-linux-arm64.AppImage"

LINUX_INSTALL_DIR="${HOME}/.local/opt/${APP_COMMAND}"
LINUX_BIN_DIR="${HOME}/.local/bin"
LINUX_DESKTOP_FILE="${HOME}/.local/share/applications/${APP_COMMAND}.desktop"

TMP_DIR=""
MOUNT_DIR=""

log() {
  printf '==> %s\n' "$*"
}

warn() {
  printf 'warning: %s\n' "$*" >&2
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [[ -n "${MOUNT_DIR}" && -d "${MOUNT_DIR}" ]]; then
    hdiutil detach "${MOUNT_DIR}" -quiet >/dev/null 2>&1 || true
  fi

  if [[ -n "${TMP_DIR}" && -d "${TMP_DIR}" ]]; then
    rm -rf "${TMP_DIR}"
  fi
}

trap cleanup EXIT

need_command() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

download() {
  local url="$1"
  local output="$2"

  need_command curl
  log "Downloading ${url}"
  curl -fL --progress-bar "${url}" -o "${output}"
}

detect_os() {
  case "$(uname -s)" in
    Darwin)
      printf 'macos\n'
      ;;
    Linux)
      if grep -qi microsoft /proc/version >/dev/null 2>&1; then
        printf 'wsl\n'
        return
      fi

      printf 'linux\n'
      ;;
    MINGW* | MSYS* | CYGWIN*)
      die "Windows is not supported by install.sh. Use the PowerShell installer instead."
      ;;
    *)
      die "unsupported operating system: $(uname -s)"
      ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64 | amd64)
      printf 'x64\n'
      ;;
    arm64 | aarch64)
      printf 'arm64\n'
      ;;
    *)
      die "unsupported CPU architecture: $(uname -m)"
      ;;
  esac
}

macos_install_dir() {
  if [[ -w "/Applications" ]]; then
    printf '/Applications\n'
    return
  fi

  printf '%s\n' "${HOME}/Applications"
}

register_macos_app() {
  local app_path="$1"
  local lsregister="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

  if [[ -x "${lsregister}" ]]; then
    "${lsregister}" -f "${app_path}" >/dev/null 2>&1 || true
  fi
}

install_macos() {
  need_command hdiutil
  need_command find
  need_command ditto

  TMP_DIR="$(mktemp -d)"
  MOUNT_DIR="${TMP_DIR}/mount"
  mkdir -p "${MOUNT_DIR}"

  local dmg_path="${TMP_DIR}/${APP_NAME}.dmg"
  download "${MACOS_DMG_URL}" "${dmg_path}"

  log "Mounting ${APP_NAME}.dmg"
  hdiutil attach "${dmg_path}" -nobrowse -readonly -mountpoint "${MOUNT_DIR}" >/dev/null

  local source_app
  source_app="$(find "${MOUNT_DIR}" -maxdepth 2 -type d -name "${APP_NAME}.app" -print -quit)"

  if [[ -z "${source_app}" ]]; then
    source_app="$(find "${MOUNT_DIR}" -maxdepth 2 -type d -name "*.app" -print -quit)"
  fi

  [[ -n "${source_app}" ]] || die "no .app bundle found in ${MACOS_DMG_URL}"

  local target_dir
  target_dir="$(macos_install_dir)"
  mkdir -p "${target_dir}"

  local target_app="${target_dir}/${APP_NAME}.app"
  local next_app="${target_dir}/.${APP_NAME}.app.next"

  log "Installing ${APP_NAME} to ${target_app}"
  rm -rf "${next_app}"
  ditto "${source_app}" "${next_app}"
  rm -rf "${target_app}"
  mv "${next_app}" "${target_app}"

  register_macos_app "${target_app}"

  log "${APP_DISPLAY_NAME} installed"
  log "Start it with: open -a \"${APP_NAME}\""
}

linux_appimage_url() {
  case "$(detect_arch)" in
    x64)
      printf '%s\n' "${LINUX_X64_APPIMAGE_URL}"
      ;;
    arm64)
      printf '%s\n' "${LINUX_ARM64_APPIMAGE_URL}"
      ;;
  esac
}

write_linux_desktop_file() {
  mkdir -p "$(dirname "${LINUX_DESKTOP_FILE}")"

  cat >"${LINUX_DESKTOP_FILE}" <<EOF
[Desktop Entry]
Type=Application
Name=${APP_DISPLAY_NAME}
Exec=${LINUX_INSTALL_DIR}/${APP_NAME}.AppImage %u
Terminal=false
Categories=Utility;
MimeType=x-scheme-handler/${APP_PROTOCOL_SCHEME};
NoDisplay=false
EOF

  chmod 644 "${LINUX_DESKTOP_FILE}"
}

register_linux_app() {
  write_linux_desktop_file

  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "${HOME}/.local/share/applications" >/dev/null 2>&1 || true
  fi

  if command -v xdg-mime >/dev/null 2>&1; then
    xdg-mime default "${APP_COMMAND}.desktop" "x-scheme-handler/${APP_PROTOCOL_SCHEME}" >/dev/null 2>&1 || true
  fi
}

install_linux() {
  TMP_DIR="$(mktemp -d)"

  local appimage_path="${TMP_DIR}/${APP_NAME}.AppImage"
  local target_appimage="${LINUX_INSTALL_DIR}/${APP_NAME}.AppImage"

  download "$(linux_appimage_url)" "${appimage_path}"

  mkdir -p "${LINUX_INSTALL_DIR}" "${LINUX_BIN_DIR}"
  install -m 755 "${appimage_path}" "${target_appimage}"
  ln -sf "${target_appimage}" "${LINUX_BIN_DIR}/${APP_COMMAND}"
  register_linux_app

  log "${APP_DISPLAY_NAME} installed to ${target_appimage}"
  log "Start it with: ${LINUX_BIN_DIR}/${APP_COMMAND}"

  case ":${PATH}:" in
    *":${LINUX_BIN_DIR}:"*) ;;
    *) warn "${LINUX_BIN_DIR} is not in PATH; add it if you want to run ${APP_COMMAND} directly." ;;
  esac
}

main() {
  case "$(detect_os)" in
    macos)
      install_macos
      ;;
    linux)
      install_linux
      ;;
    wsl)
      die "WSL is not supported for desktop installation. Use the Windows PowerShell installer instead."
      ;;
  esac
}

main "$@"
