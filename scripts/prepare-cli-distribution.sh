#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${ROOT_DIR}/apps/hello-world/src-tauri/target"
OUTPUT_DIRS=(
  "${ROOT_DIR}/apps/hello-world/dist/downloads"
  "${ROOT_DIR}/apps/hello-world/public/downloads"
)

copied_count=0

copy_latest() {
  local label="$1"
  local output_name="$2"
  local source_path
  shift 2

  source_path="$(
    for find_pattern in "$@"; do
      find "${TARGET_DIR}" -type f -path "${find_pattern}" -print
    done | sort | tail -n 1
  )"

  if [[ -z "${source_path}" ]]; then
    printf 'Skipped %s: no artifact found\n' "${label}"
    return
  fi

  for output_dir in "${OUTPUT_DIRS[@]}"; do
    mkdir -p "${output_dir}"
    cp "${source_path}" "${output_dir}/${output_name}"
  done

  copied_count=$((copied_count + 1))

  printf 'Prepared %s: %s\n' "${label}" "${OUTPUT_DIRS[0]}/${output_name}"
}

linux_x64_patterns=("*/x86_64-unknown-linux-gnu/release/bundle/appimage/*.AppImage")
linux_arm64_patterns=("*/aarch64-unknown-linux-gnu/release/bundle/appimage/*.AppImage")

if [[ "$(uname -s)" == "Linux" ]]; then
  case "$(uname -m)" in
    x86_64 | amd64)
      linux_x64_patterns+=("*/release/bundle/appimage/*.AppImage")
      ;;
    arm64 | aarch64)
      linux_arm64_patterns+=("*/release/bundle/appimage/*.AppImage")
      ;;
  esac
fi

copy_latest "macOS DMG" "HelloWorld-macos.dmg" "*/release/bundle/dmg/*.dmg"
copy_latest "Windows x64 MSI" "HelloWorld-windows-x64.msi" "*/release/bundle/msi/*.msi"
copy_latest "Linux x64 AppImage" "HelloWorld-linux-x64.AppImage" "${linux_x64_patterns[@]}"
copy_latest "Linux arm64 AppImage" "HelloWorld-linux-arm64.AppImage" "${linux_arm64_patterns[@]}"

if [[ "${copied_count}" -eq 0 ]]; then
  printf 'error: no distribution artifacts found in %s\n' "${TARGET_DIR}" >&2
  exit 1
fi
