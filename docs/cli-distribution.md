# CLI 分发

这份文档只说明 CLI 怎么分发。安装脚本实现细节见 `docs/cli-implementation.md`，安装包怎么生成见 `docs/packaging.md`。

CLI 分发的是里层 Hello World 桌面应用：

```text
apps/hello-world
```

分发站点需要提供两个路径：

```text
/install.sh
/downloads/
```

本地开发时，分发站点是里层应用：

```text
http://localhost:1420
```

外层首页是：

```text
http://localhost:1410
```

CLI 分发不要走 1410。

## 分发文件

安装脚本源码：

```text
apps/hello-world/public/install.sh
```

构建后位置：

```text
apps/hello-world/dist/install.sh
```

下载目录：

```text
apps/hello-world/dist/downloads/
```

本地调试时也会用到：

```text
apps/hello-world/public/downloads/
```

`apps/hello-world/public/downloads/` 只是给本地 dev server 使用，不提交。

## 安装包文件名

`/downloads/` 下需要放这些固定文件名：

```text
HelloWorld-macos.dmg
HelloWorld-windows-x64.msi
HelloWorld-linux-x64.AppImage
HelloWorld-linux-arm64.AppImage
```

用户执行安装命令时，安装脚本会从 `/downloads/` 下载当前系统对应的文件。

## 本地分发

先生成当前平台安装包：

```bash
pnpm run build:hello-world
```

再准备下载目录：

```bash
pnpm run prepare:cli
```

启动里层 Web 服务：

```bash
pnpm -C apps/hello-world run dev:web
```

本地安装命令：

```bash
curl -fsSL http://localhost:1420/install.sh | bash -s -- http://localhost:1420/downloads
```

## 线上分发

线上部署里层应用构建产物：

```text
apps/hello-world/dist
```

部署后，站点根目录应能访问：

```text
https://你的域名/install.sh
https://你的域名/downloads/HelloWorld-macos.dmg
https://你的域名/downloads/HelloWorld-windows-x64.msi
https://你的域名/downloads/HelloWorld-linux-x64.AppImage
https://你的域名/downloads/HelloWorld-linux-arm64.AppImage
```

用户安装命令：

```bash
curl -fsSL https://你的域名/install.sh | bash -s -- https://你的域名/downloads
```

如果外层首页和里层分发站点不是同一个域名，构建外层首页时指定分发地址：

```bash
VITE_HELLO_WORLD_DISTRIBUTION_ORIGIN=https://你的域名 pnpm run build:home
```

首页会生成同一个分发站点下的安装命令：

```text
curl -fsSL https://你的域名/install.sh | bash -s -- https://你的域名/downloads
```

## 发布检查

发布前确认：

```text
apps/hello-world/dist/install.sh 存在
apps/hello-world/dist/downloads/ 存在
需要支持的平台安装包都在 downloads 里
线上域名可以直接访问 install.sh
线上域名可以直接下载 downloads 里的安装包
```

只发布部分平台也可以。没有放进 `/downloads/` 的平台，用户在对应系统上安装会失败。

## 常见问题

`curl: (7) Failed to connect`

```text
本地里层 Web 服务没启动。先运行 pnpm -C apps/hello-world run dev:web。
```

`curl: (22) The requested URL returned error: 404`

```text
install.sh 或 downloads 不在当前分发站点。确认用的是 1420，或确认线上部署包含 downloads。
```

安装脚本提示 `missing download base url`

```text
命令少了 bash -s -- 后面的下载地址。
```
