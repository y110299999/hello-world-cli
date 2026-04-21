#!/usr/bin/env bash
set -euo pipefail

CLI_NAME="hello-world-cli"
DOWNLOAD_BASE_URL="${1:-${HELLO_WORLD_CLI_DOWNLOAD_BASE_URL:-http://localhost:1420/downloads}}"
INSTALL_DIR="${HELLO_WORLD_CLI_INSTALL_DIR:-${HOME}/.local/bin}"
TARGET_PATH="${INSTALL_DIR}/${CLI_NAME}"

DOWNLOAD_BASE_URL="${DOWNLOAD_BASE_URL%/}"

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

need_command() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

detect_os() {
  case "$(uname -s)" in
    Darwin)
      printf 'macos\n'
      ;;
    Linux)
      printf 'linux\n'
      ;;
    MINGW* | MSYS* | CYGWIN*)
      die "Windows is not supported by install-cli.sh. Use install-cli.ps1 instead."
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

tmp_file=""

cleanup() {
  if [[ -n "${tmp_file}" && -f "${tmp_file}" ]]; then
    rm -f "${tmp_file}"
  fi
}

trap cleanup EXIT

main() {
  need_command curl
  need_command install
  need_command mktemp

  local binary_name
  local binary_url

  binary_name="${CLI_NAME}-$(detect_os)-$(detect_arch)"
  binary_url="${DOWNLOAD_BASE_URL}/${binary_name}"
  tmp_file="$(mktemp)"

  log "Downloading ${binary_url}"
  curl -fL --progress-bar "${binary_url}" -o "${tmp_file}"

  mkdir -p "${INSTALL_DIR}"
  install -m 755 "${tmp_file}" "${TARGET_PATH}"

  log "Installed ${CLI_NAME} to ${TARGET_PATH}"

  case ":${PATH}:" in
    *":${INSTALL_DIR}:"*) ;;
    *) warn "${INSTALL_DIR} is not in PATH; add it before running ${CLI_NAME} directly." ;;
  esac
}

main "$@"
