# CLI 分发

当前项目只保留 mock CLI 安装验证。

公开安装入口：

```bash
curl -fsSL https://你的域名/install-cli.sh | bash -s -- https://你的域名/downloads
```

Windows：

```powershell
powershell -c "$env:HELLO_WORLD_CLI_DOWNLOAD_BASE_URL='https://你的域名/downloads'; irm https://你的域名/install-cli.ps1 | iex"
```

安装脚本位置：

```text
apps/hello-world/public/install-cli.sh
apps/hello-world/public/install-cli.ps1
```

它们下载预编译的 mock `hello-world-cli` Rust binary 并安装到用户 bin 目录，不下载桌面安装包，不调用 cargo。

详细说明见：

```text
docs/mock-cli.md
```
