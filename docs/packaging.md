# 打包流程

CLI 分发仍然需要打包逻辑。`apps/hello-world/public/install.sh` 只负责下载安装包，安装包本身需要先由 Tauri 打出来，再放到里层应用站点的 `/downloads` 目录。

## 打包入口

从根目录打包当前平台：

```bash
pnpm run build:hello-world
```

实际执行链路：

```text
pnpm run build:hello-world
  -> pnpm -C apps/hello-world run build
  -> tauri build
```

单独打包平台目标：

```bash
pnpm run build:hello-world:mac
pnpm run build:hello-world:win
pnpm run build:hello-world:linux
pnpm run build:hello-world:linux:arm64
```

对应子项目命令：

```bash
tauri build
tauri build --target x86_64-pc-windows-gnu
tauri build --target x86_64-unknown-linux-gnu
tauri build --target aarch64-unknown-linux-gnu
```

Windows 和 Linux 交叉编译需要对应 Rust target、系统依赖和打包工具链；环境没装齐时会失败，这是构建环境问题，不是安装脚本问题。

## 打包流水线

Tauri 打包前会先构建桌面 App 的前端页面：

```json
{
  "beforeBuildCommand": "pnpm run build:web",
  "frontendDist": "../dist"
}
```

配置位置：

```text
apps/hello-world/src-tauri/tauri.conf.json
```

实际流程：

```text
tauri build
  -> pnpm run build:web
  -> vite build
  -> 生成 apps/hello-world/dist
  -> Cargo 编译 Rust/Tauri
  -> 读取 src-tauri/tauri.conf.json
  -> 生成当前平台安装包
```

## 产物位置

macOS DMG 通常在：

```text
apps/hello-world/src-tauri/target/release/bundle/dmg/
```

Windows MSI 通常在：

```text
apps/hello-world/src-tauri/target/x86_64-pc-windows-gnu/release/bundle/msi/
```

Linux AppImage 通常在：

```text
apps/hello-world/src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/
```

## CLI 分发目录

`pnpm run prepare:cli` 会把已存在的安装包复制到：

```text
apps/hello-world/dist/downloads/HelloWorld-macos.dmg
apps/hello-world/dist/downloads/HelloWorld-windows-x64.msi
apps/hello-world/dist/downloads/HelloWorld-linux-x64.AppImage
apps/hello-world/dist/downloads/HelloWorld-linux-arm64.AppImage
```

没有生成的平台会跳过。这样可以在不同系统或 CI job 中分别打包，再统一发布 `dist`。

## 根站点构建

根站点只负责首页：

```bash
pnpm run build:home
```

构建后会生成：

```text
dist/index.html
```

## 完整发布顺序

```text
pnpm run build:home
pnpm run build:hello-world
pnpm run prepare:cli
部署 dist
```

根目录默认构建命令会执行这三步：

```bash
pnpm run build
```

## 清理

Tauri/Rust 构建缓存可以删除：

```bash
pnpm run clean:tauri
```

删除后不影响源码，下次打包会重新生成。
