# Mock CLI 安装

当前项目只要求验证 mock CLI 安装，不要求普通用户安装 Rust 或 Cargo。

## 首次准备（维护者）

新拉项目后需要先编译一次，生成预编译 binary：

```bash
# 1. 编译 Rust CLI
cargo build --release --manifest-path crates/hello-world-cli/Cargo.toml

# 2. 把 binary 复制到 public/downloads/（供安装脚本下载）
pnpm prepare:cli

# 3. 安装到本地 ~/.local/bin/
pnpm install:mock-cli
```

之后如果 `public/downloads/` 里的 binary 已提交到仓库或由 CI 构建，其他人拉代码后跳过第 1 步，直接从第 2 步开始即可。

安装产物是 Rust 编译出来的 `hello-world-cli` 可执行文件。安装脚本只负责下载和放置这个文件。

用户安装入口是：

```bash
curl -fsSL https://你的域名/install-cli.sh | bash -s -- https://你的域名/downloads
```

Windows：

```powershell
powershell -c "$env:HELLO_WORLD_CLI_DOWNLOAD_BASE_URL='https://你的域名/downloads'; irm https://你的域名/install-cli.ps1 | iex"
```

这两个脚本不会编译源码，也不会调用 cargo。

## 文件位置

```text
apps/hello-world/public/install-cli.sh
apps/hello-world/public/install-cli.ps1
apps/hello-world/public/downloads/hello-world-cli-<系统>-<架构>
crates/hello-world-cli
scripts/install-mock-cli.mjs
```

`install-cli.sh` 用于 macOS / Linux，默认安装到：

```text
~/.local/bin/hello-world-cli
```

`install-cli.ps1` 用于 Windows，默认安装到：

```text
C:\Users\你的用户名\.local\bin\hello-world-cli.exe
```

本地开发也可以执行：

```bash
pnpm run install:mock-cli
```

它运行的是：

```bash
node scripts/install-mock-cli.mjs
```

它同样不调用 cargo，只会复制已经存在的预编译 Rust binary。

## 支持的命令

```bash
hello-world-cli
hello-world-cli hello
hello-world-cli open
hello-world-cli --help
hello-world-cli --version
```

当前只是 mock：

```bash
hello-world-cli open
```

输出：

```text
Mock open: hello-world://open
```

## 验证

macOS / Linux：

```bash
which hello-world-cli
hello-world-cli --version
hello-world-cli --help
hello-world-cli open
```

Windows：

```powershell
where.exe hello-world-cli
hello-world-cli --version
```

## 卸载

macOS / Linux：

```bash
rm ~/.local/bin/hello-world-cli
```

Windows：

```powershell
Remove-Item "$HOME\.local\bin\hello-world-cli.exe"
```
