# 自定义协议接入

这份文档只写 `hello-world://` 自定义协议。其他打包流程见 `docs/packaging.md`。

## 当前目标

首页点击：

```text
进入 Hello World
```

实际打开：

```text
hello-world://open
```

如果本机已经安装并注册了 Hello World 桌面程序，系统会把这个地址交给桌面程序处理。

## 使用的技术

这里用了 Tauri v2 的 deep-link 插件：

```text
tauri-plugin-deep-link
```

它做的事情是：

1. 在 Tauri 配置里声明要注册的 URL scheme。
2. 在 Rust 入口里初始化插件。
3. Tauri 打包时把协议声明写入平台安装包或应用元数据。
4. 用户点击 `hello-world://...` 时，操作系统根据协议找到对应应用。

在 macOS 上，协议会写入 `.app/Contents/Info.plist` 的 `CFBundleURLTypes`。当前验证过的结果里有：

```text
CFBundleURLSchemes = hello-world
```

Windows 和 Linux 也走平台自己的协议注册机制，由 Tauri 打包器根据配置生成对应元数据。

## 代码位置

首页入口在：

```text
src/App.tsx
```

当前协议地址：

```tsx
const APP_URL = 'hello-world://open'
```

点击按钮后执行：

```tsx
window.location.href = APP_URL
```

Tauri 协议配置在：

```text
apps/hello-world/src-tauri/tauri.conf.json
```

核心配置：

```json
{
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["hello-world"]
      }
    }
  }
}
```

Rust 插件初始化在：

```text
apps/hello-world/src-tauri/src/main.rs
```

核心代码：

```rust
fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_deep_link::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

Rust 依赖在：

```text
apps/hello-world/src-tauri/Cargo.toml
```

核心依赖：

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-deep-link = "2"
```

## 接入步骤

如果从零添加自定义协议，需要做四步。

第一步，在首页里决定协议地址：

```tsx
const APP_URL = 'hello-world://open'
```

第二步，在 Tauri 配置里声明 scheme：

```json
{
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["hello-world"]
      }
    }
  }
}
```

第三步，在 Rust 入口里启用插件：

```rust
.plugin(tauri_plugin_deep_link::init())
```

第四步，在 Cargo 依赖里加入插件：

```toml
tauri-plugin-deep-link = "2"
```

这四处必须保持一致。首页用的是 `hello-world://open`，Tauri 注册的 scheme 就必须是 `hello-world`。

## 唤起流程

完整链路：

```text
用户点击首页按钮
  -> 浏览器跳转 hello-world://open
  -> 操作系统查找 hello-world 协议处理程序
  -> 找到 Hello World 桌面应用
  -> 启动或唤起 Hello World
```

如果系统没有找到协议处理程序，浏览器通常不会打开应用。不同浏览器表现不同，有的会弹提示，有的会静默失败。

## 首页如何判断失败

浏览器不能直接问系统“有没有安装 Hello World”。当前使用的是唤起结果判断：

```text
跳转 hello-world://open
  -> 如果页面隐藏或 pagehide，认为唤起成功
  -> 如果 1800ms 后页面还在，认为没有检测到打开成功
  -> 显示下载兜底
```

相关事件：

```text
visibilitychange
pagehide
```

相关状态：

```text
idle
trying
fallback
```

这是浏览器里处理自定义协议唤起时常见的兜底方式。它不是系统级安装检测，也不能区分“没安装”和“浏览器确认框还没点”。所以页面文案只说没有检测到打开成功，不直接说本机没有安装。

## 验证方式

先打包 macOS `.app`：

```bash
pnpm -C apps/hello-world exec tauri build --bundles app --ci
```

再检查 `Info.plist`：

```bash
plutil -p apps/hello-world/src-tauri/target/release/bundle/macos/HelloTauri.app/Contents/Info.plist
```

如果看到下面内容，说明协议已经写进 `.app`：

```text
CFBundleURLTypes
CFBundleURLSchemes
hello-world
```

也可以只搜索关键信息：

```bash
plutil -p apps/hello-world/src-tauri/target/release/bundle/macos/HelloTauri.app/Contents/Info.plist | rg "CFBundleURLTypes|CFBundleURLSchemes|hello-world"
```

## 修改协议名

如果以后要把协议改成：

```text
demo-app://open
```

需要同时改：

```text
src/App.tsx
apps/hello-world/src-tauri/tauri.conf.json
docs/custom-protocol.md
```

对应关系：

```text
首页 URL: demo-app://open
Tauri scheme: demo-app
```

不要只改一边。首页和 Tauri 配置不一致时，系统无法把首页点击交给应用。
