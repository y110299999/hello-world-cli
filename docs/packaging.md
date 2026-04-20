# 打包流程

这份文档只写除自定义协议以外的打包逻辑。自定义协议见 `docs/custom-protocol.md`。

## 当前项目关系

根目录是首页项目：

```text
src/
index.html
vite.config.ts
package.json
```

Hello World 桌面程序在：

```text
apps/hello-world/
```

真正被 Tauri 打包的是 `apps/hello-world`，不是根目录首页。

## 打包入口

从根目录打包 Hello World：

```bash
pnpm run build
```

根目录脚本会转到子项目：

```json
{
  "build": "pnpm -C apps/hello-world run build"
}
```

子项目执行：

```json
{
  "build": "tauri build"
}
```

所以完整入口是：

```text
pnpm run build
  -> pnpm -C apps/hello-world run build
  -> tauri build
```

## 打包流水线

执行 `tauri build` 后，Tauri 会读取：

```text
apps/hello-world/src-tauri/tauri.conf.json
```

其中构建配置是：

```json
{
  "build": {
    "beforeBuildCommand": "pnpm run build:web",
    "frontendDist": "../dist"
  }
}
```

实际流程：

```text
tauri build
  -> 执行 beforeBuildCommand
  -> pnpm run build:web
  -> vite build
  -> 生成 apps/hello-world/dist
  -> Cargo 编译 Rust/Tauri
  -> 读取 src-tauri/tauri.conf.json
  -> 读取图标和窗口配置
  -> 生成桌面应用和安装包
```

前端页面构建命令：

```bash
pnpm -C apps/hello-world run build:web
```

它会输出：

```text
apps/hello-world/dist/
```

Tauri 通过 `frontendDist` 把这个目录打进桌面程序：

```json
{
  "frontendDist": "../dist"
}
```

这里的路径是相对于 `apps/hello-world/src-tauri` 来算的，所以 `../dist` 指向：

```text
apps/hello-world/dist
```

## 桌面窗口配置

窗口配置在：

```text
apps/hello-world/src-tauri/tauri.conf.json
```

当前窗口：

```json
{
  "title": "Hello Tauri",
  "width": 800,
  "height": 600
}
```

这决定应用启动后的窗口标题和初始尺寸。

## 图标配置

当前只保留桌面打包需要的图标：

```json
{
  "icon": [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ]
}
```

对应文件在：

```text
apps/hello-world/src-tauri/icons/
```

含义：

- `icon.icns`：macOS 使用。
- `icon.ico`：Windows 使用。
- `32x32.png`、`128x128.png`、`128x128@2x.png`：通用 PNG 图标。

如果重新生成图标，可以使用 Tauri CLI：

```bash
pnpm -C apps/hello-world exec tauri icon ../../app-icon.svg
```

注意：`tauri icon` 可能会重新生成 iOS、Android、Windows Store 等额外图标。当前项目只保留桌面打包需要的图标。

## 平台打包命令

当前根目录脚本：

```bash
pnpm run build:hello-world
pnpm run build:hello-world:mac
pnpm run build:hello-world:win
pnpm run build:hello-world:linux
```

对应子项目脚本：

```bash
tauri build
tauri build --target x86_64-pc-windows-gnu
tauri build --target x86_64-unknown-linux-gnu
```

macOS 本机可以直接打 macOS 包。Windows/Linux 目标需要对应 Rust target、系统依赖和打包工具链；如果环境没装齐，命令会失败，这是交叉编译环境问题，不是项目源码问题。

## 产物位置

前端产物：

```text
apps/hello-world/dist/
```

Rust/Tauri 构建目录：

```text
apps/hello-world/src-tauri/target/
```

macOS `.app` 通常在：

```text
apps/hello-world/src-tauri/target/release/bundle/macos/
```

macOS `.dmg` 通常在：

```text
apps/hello-world/src-tauri/target/release/bundle/dmg/
```

主程序二进制在：

```text
apps/hello-world/src-tauri/target/release/hello-tauri
```

## target 目录是什么

`target` 是 Rust/Cargo 的构建输出目录，也被 Tauri 用来放打包产物。

里面通常包括：

```text
target/release/deps/         编译好的依赖缓存
target/release/build/        build script 输出
target/release/bundle/       Tauri 打包结果
target/release/hello-tauri   最终二进制
```

它可以很大，因为 Tauri 会编译窗口、WebView、系统 API、插件等 Rust 依赖。

可以删除：

```bash
pnpm run clean:tauri
```

删除后不影响源码，下次打包会重新生成，只是第一次会慢。

## gen 目录是什么

`apps/hello-world/src-tauri/gen` 是 Tauri 生成目录，里面通常是 schema 和权限辅助文件，例如：

```text
schemas/
```

它不是手写源码，已经在 `.gitignore` 中忽略。删除后，Tauri 构建会按需重新生成。

## 清理命令

清理 Rust/Tauri 构建缓存：

```bash
pnpm run clean:tauri
```

如果只清理子项目：

```bash
pnpm -C apps/hello-world run clean
```

手动删除前端构建产物：

```bash
rm -rf dist apps/hello-world/dist
```

## 最小打包理解

一句话：

```text
apps/hello-world/src 先被 Vite 构建成 dist，再由 Tauri 把 dist、Rust 程序、图标、配置一起打成桌面应用。
```

最关键的三处：

```text
apps/hello-world/package.json
apps/hello-world/src-tauri/tauri.conf.json
apps/hello-world/src-tauri/src/main.rs
```
