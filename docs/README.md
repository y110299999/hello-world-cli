# 项目说明

这个项目保留两个核心部分：

- 根目录首页：负责显示“进入 Hello World”，打开里层 Hello World 应用站点；如果没有检测到打开成功，就显示 CLI 安装兜底。
- `apps/hello-world`：真正被打包成桌面程序的 Tauri 应用，并注册 `hello-world://` 自定义协议。

## 文档目录

- `docs/custom-protocol.md`：自定义协议怎么接入、用了什么技术、怎么验证。
- `docs/packaging.md`：生成 CLI 分发需要的多系统安装包。
- `docs/cli-distribution.md`：通过里层应用站点的 `install.sh` 分发安装多系统 App。
- `docs/mock-rust-cli.md`：本地 mock 的 Rust CLI 包在哪里、怎么安装到本机。
- `docs/README.md`：当前项目边界和常用命令。

## 目录职责

```text
.
  src/                         根目录首页
  apps/hello-world/src/         Hello World 桌面应用页面
  apps/hello-world/src-tauri/   Tauri 桌面壳、打包配置、Rust 入口
```

根目录首页不参与桌面打包。桌面打包只读取 `apps/hello-world`。

## 首页怎么打开里层应用

当前做法是：

1. 用户点击“进入 Hello World”。
2. 首页跳转到里层 Hello World 应用站点。
3. 本地开发时默认打开 `http://localhost:1420`。
4. 线上可以通过 `VITE_HELLO_WORLD_DISTRIBUTION_ORIGIN` 指定里层应用站点。
5. 如果没有检测到打开成功，首页显示 CLI 安装兜底。

这个逻辑在 `src/App.tsx`：

```text
DEV_DISTRIBUTION_ORIGIN = "http://localhost:1420"
OPEN_TIMEOUT_MS = 1000
```

这里检测的是“页面有没有切走”，不是系统级安装状态。

安装命令也在 `src/App.tsx`。本地开发时，CLI 分发走里层应用地址：

```text
curl -fsSL http://localhost:1420/install.sh | bash -s -- http://localhost:1420/downloads
```

这个命令会按系统下载 `/downloads` 下对应安装包。安装包需要由部署环境提供，首页和安装脚本都不负责生成安装包。

本地调试 Windows 安装时，需要先生成 Windows MSI，再准备 CLI 分发目录：

```powershell
pnpm run build:hello-world
pnpm run prepare:cli
```

`prepare:cli` 使用 Node 脚本实现，Windows 上可以直接执行，不需要额外安装 bash。

## 常用命令

开发首页：

```bash
pnpm dev
```

开发 Hello World 桌面应用：

```bash
pnpm run dev:hello-world
```

构建首页：

```bash
pnpm run build:home
```

打包 Hello World 桌面应用：

```bash
pnpm run build:hello-world
```

准备 CLI 分发下载目录：

```bash
pnpm run prepare:cli
```

这条命令会把已生成的 DMG、MSI、AppImage 复制到 `/downloads` 对应目录；Windows 也直接运行这条命令即可。

安装本地 mock Rust CLI：

```bash
pnpm run install:mock-cli
```

这条命令会执行 `cargo install --path crates/hello-world-cli --force`，把 mock CLI 安装到当前用户的 Cargo bin 目录，通常是 `~/.cargo/bin`。

单独打包平台目标：

```bash
pnpm run build:hello-world:mac
pnpm run build:hello-world:win
pnpm run build:hello-world:linux
pnpm run build:hello-world:linux:arm64
```

构建根站点和 Hello World 桌面应用：

```bash
pnpm run build
```

清理 Tauri/Rust 构建缓存：

```bash
pnpm run clean:tauri
```

## 哪些是生成物

这些目录不是源码，可以删除，也不应该提交：

```text
dist/
apps/hello-world/dist/
apps/hello-world/src-tauri/gen/
apps/hello-world/src-tauri/target/
```

含义：

- `dist`：Vite 前端构建产物。
- `src-tauri/gen`：Tauri 生成的 schema 和权限辅助文件。
- `src-tauri/target`：Cargo/Rust 编译缓存和 Tauri 打包产物。

删除后不会影响源码。下次构建会重新生成。

## 保留的图标

当前保留 Tauri 配置明确引用的桌面图标：

```text
apps/hello-world/src-tauri/icons/icon.png
apps/hello-world/src-tauri/icons/32x32.png
apps/hello-world/src-tauri/icons/128x128.png
apps/hello-world/src-tauri/icons/128x128@2x.png
apps/hello-world/src-tauri/icons/icon.icns
apps/hello-world/src-tauri/icons/icon.ico
```
