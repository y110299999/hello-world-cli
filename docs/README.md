# 项目说明

这个项目保留两个核心部分：

- 根目录首页：负责显示“进入 Hello World”，尝试唤起本机桌面程序；如果没有唤起成功，就显示下载入口。
- `apps/hello-world`：真正被打包成桌面程序的 Tauri 应用，并注册 `hello-world://` 自定义协议。

## 文档目录

- `docs/custom-protocol.md`：自定义协议怎么接入、用了什么技术、怎么验证。
- `docs/packaging.md`：除自定义协议以外的打包流程、脚本、产物位置、清理规则。
- `docs/README.md`：当前项目边界和常用命令。

## 目录职责

```text
.
  src/                         根目录首页
  apps/hello-world/src/         Hello World 桌面应用页面
  apps/hello-world/src-tauri/   Tauri 桌面壳、打包配置、Rust 入口
```

根目录首页不参与桌面打包。桌面打包只读取 `apps/hello-world`。

## 首页怎么判断是否安装

浏览器没有一个可靠 API 可以直接判断“本机是否安装了某个桌面应用”。当前做法是：

1. 用户点击“进入 Hello World”。
2. 首页跳转到 `hello-world://open`。
3. 如果系统已经注册这个协议，浏览器会把地址交给 Hello World 桌面程序。
4. 如果页面在一段时间内没有被隐藏或离开，就认为没有唤起成功。
5. 首页显示下载入口。

这个逻辑在 `src/App.tsx`：

```text
APP_URL = "hello-world://open"
OPEN_TIMEOUT_MS = 1800
```

下载入口也在 `src/App.tsx`：

```text
/downloads/HelloTauri-macos.dmg
/downloads/HelloTauri-windows-x64.msi
/downloads/HelloTauri-linux-x64.AppImage
```

这些文件需要由部署环境提供。首页只负责展示链接，不负责生成安装包。

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
pnpm run build
```

只打包 Hello World：

```bash
pnpm run build:hello-world
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

当前只保留 Tauri 配置明确引用的桌面图标：

```text
apps/hello-world/src-tauri/icons/32x32.png
apps/hello-world/src-tauri/icons/128x128.png
apps/hello-world/src-tauri/icons/128x128@2x.png
apps/hello-world/src-tauri/icons/icon.icns
apps/hello-world/src-tauri/icons/icon.ico
```

如果重新运行 `tauri icon`，它可能会重新生成 iOS、Android、Windows Store 等额外图标。当前项目只需要桌面打包，所以多余图标可以继续删掉。
