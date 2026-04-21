# 打包说明

当前项目暂时不做桌面安装包分发，只验证 mock CLI 安装。

安装产物是预编译的 mock `hello-world-cli` Rust binary。

用户侧安装命令不依赖 cargo：

```bash
curl -fsSL https://你的域名/install-cli.sh | bash -s -- https://你的域名/downloads
```

Windows：

```powershell
powershell -c "$env:HELLO_WORLD_CLI_DOWNLOAD_BASE_URL='https://你的域名/downloads'; irm https://你的域名/install-cli.ps1 | iex"
```

构建站点时，Vite 会把 `apps/hello-world/public` 下的安装脚本复制到 `apps/hello-world/dist`。`pnpm run prepare:cli` 会把已经存在的 Rust binary 准备到 `downloads` 目录。
