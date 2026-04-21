# Mock Rust CLI

这个文档说明当前项目里临时 mock 的 Rust CLI。

它只用来验证：

```text
本地 Rust CLI 包 -> 安装到电脑 -> 终端能直接运行 hello-world-cli
```

它不是桌面 App 的安装脚本。

桌面 App 安装脚本在：

```text
apps/hello-world/public/install.sh
apps/hello-world/public/install.ps1
```

mock CLI 包在：

```text
crates/hello-world-cli
```

## 文件位置

```text
crates/hello-world-cli/Cargo.toml
crates/hello-world-cli/Cargo.lock
crates/hello-world-cli/src/main.rs
```

`Cargo.toml` 里定义了命令名：

```toml
[[bin]]
name = "hello-world-cli"
path = "src/main.rs"
```

所以安装后，终端里的命令就是：

```bash
hello-world-cli
```

## 本地安装

在项目根目录执行：

```bash
pnpm run install:mock-cli
```

这条脚本在根目录 `package.json` 里：

```json
{
  "install:mock-cli": "cargo install --path crates/hello-world-cli --force"
}
```

也就是实际执行：

```bash
cargo install --path crates/hello-world-cli --force
```

如果不在项目根目录，也可以用绝对路径：

```bash
cargo install --path /Users/weihua/project/hello-world_cli/crates/hello-world-cli --force
```

## 安装到哪里了

`cargo install` 会编译这个 Rust 包，然后把可执行文件放到 Cargo 的 bin 目录。

当前这台机器上是：

```text
/Users/weihua/.cargo/bin/hello-world-cli
```

所以它不是安装到项目目录里，而是安装到当前电脑的用户环境里。

## 为什么可以直接运行

安装后可以运行：

```bash
hello-world-cli --help
hello-world-cli --version
hello-world-cli open
```

原因是：

```text
/Users/weihua/.cargo/bin 在 PATH 里
hello-world-cli 文件在 /Users/weihua/.cargo/bin 里
终端能通过 PATH 找到这个命令
```

可以这样确认：

```bash
which hello-world-cli
```

当前结果是：

```text
/Users/weihua/.cargo/bin/hello-world-cli
```

`--help`、`--version`、`open` 是传给这个命令的参数，由 `src/main.rs` 处理。

## 当前支持的命令

```bash
hello-world-cli
hello-world-cli hello
hello-world-cli open
hello-world-cli --help
hello-world-cli --version
```

现在只是 mock。

```bash
hello-world-cli open
```

当前只会输出：

```text
Mock open: hello-world://open
```

还没有真的打开桌面 App。

## Windows

这个 Rust CLI 代码本身基本可以在 Windows 编译运行，因为它只用了 Rust 标准库。

Windows 本地安装类似这样：

```powershell
cargo install --path C:\path\to\hello-world_cli\crates\hello-world-cli --force
```

安装后一般会在：

```text
C:\Users\你的用户名\.cargo\bin\hello-world-cli.exe
```

但当前项目还没有做 Windows 的 CLI 一键安装脚本。

现在的 `install.ps1` 是安装桌面 App 的 MSI，不是安装这个 mock CLI。

## 部署后不能这么装

这条命令只适合本地开发：

```bash
cargo install --path /Users/weihua/project/hello-world_cli/crates/hello-world-cli --force
```

因为它依赖本机源码路径：

```text
/Users/weihua/project/hello-world_cli/crates/hello-world-cli
```

别人电脑或服务器上没有这个路径。

正式分发时，应该改成类似：

```bash
cargo install hello-world-cli
```

或者：

```bash
curl -fsSL https://你的域名/install-cli.sh | sh
```

也可以走 Homebrew：

```bash
brew install hello-world-cli
```

当前项目还没有实现正式 CLI 分发，只是本地 mock。

## 验证

```bash
which hello-world-cli
hello-world-cli --version
hello-world-cli --help
hello-world-cli open
```

## 卸载

```bash
cargo uninstall hello-world-cli
```

这只会删除本机安装的命令，不会删除项目里的：

```text
crates/hello-world-cli
```
