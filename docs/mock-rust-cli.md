# Mock Rust CLI 本地安装说明

这份文档只说明当前项目里临时 mock 的 Rust CLI 包在哪里、它怎么被安装到本机，以及安装后为什么能在终端直接运行。

它和 `apps/hello-world/public/install.sh` 不是同一套安装逻辑：

- `install.sh`：下载安装 Hello World 桌面 App 的 DMG/AppImage。
- mock Rust CLI：用 `cargo install --path ...` 把一个本地 Rust 命令行包安装到当前电脑。

## Mock 包在哪里

mock Rust CLI 包在：

```text
crates/hello-world-cli
```

核心文件：

```text
crates/hello-world-cli/Cargo.toml
crates/hello-world-cli/Cargo.lock
crates/hello-world-cli/src/main.rs
```

`Cargo.toml` 里定义了 Rust 包名和命令入口：

```toml
[package]
name = "hello-world-cli"
version = "0.1.0"

[[bin]]
name = "hello-world-cli"
path = "src/main.rs"
```

这里有两个名字需要区分：

```text
package name = hello-world-cli
binary name = hello-world-cli
```

`package name` 是 Cargo 识别的包名。

`binary name` 是最终安装到电脑上的命令名。安装完成后，用户在终端里输入的就是：

```bash
hello-world-cli
```

## Mock CLI 现在能做什么

当前只是一个最小 mock，不是真正的生产 CLI。

支持的命令：

```bash
hello-world-cli
hello-world-cli hello
hello-world-cli open
hello-world-cli --help
hello-world-cli --version
```

其中：

```bash
hello-world-cli open
```

当前只会输出：

```text
Mock open: hello-world://open
```

它只是模拟“未来 CLI 可能会通过 `hello-world://open` 打开桌面 App”这件事，还没有真的调用系统打开应用。

## 怎么安装到本机

根目录 `package.json` 里有一个脚本：

```json
{
  "install:mock-cli": "cargo install --path crates/hello-world-cli --force"
}
```

所以从项目根目录执行：

```bash
pnpm run install:mock-cli
```

等价于执行：

```bash
cargo install --path crates/hello-world-cli --force
```

这条命令的意思是：

```text
用 Cargo 安装一个本地路径里的 Rust 包
路径是 crates/hello-world-cli
如果本机已经安装过同名命令，用 --force 覆盖
```

## 为什么会安装到自己电脑上

`cargo install --path crates/hello-world-cli --force` 会做三件事：

1. 读取 `crates/hello-world-cli/Cargo.toml`。
2. 用 release 模式编译这个 Rust CLI。
3. 把编译出来的可执行文件复制到 Cargo 的用户级 bin 目录。

在 macOS/Linux 上，默认安装目录通常是：

```text
~/.cargo/bin
```

当前这台机器上的实际安装位置是：

```text
/Users/weihua/.cargo/bin/hello-world-cli
```

所以它不是安装到了项目目录里，而是安装到了当前用户的电脑环境里。

只要 `~/.cargo/bin` 在 `PATH` 里，终端就能直接找到这个命令：

```bash
hello-world-cli --version
```

当前验证结果是：

```text
hello-world-cli 0.1.0
```

## PATH 是什么角色

终端里输入：

```bash
hello-world-cli
```

系统不会扫描整个电脑找这个文件，而是只会去 `PATH` 里列出的目录查找。

如果 `~/.cargo/bin` 在 `PATH` 中，系统就能找到：

```text
~/.cargo/bin/hello-world-cli
```

可以用这条命令确认当前命令来自哪里：

```bash
which hello-world-cli
```

当前这台机器返回：

```text
/Users/weihua/.cargo/bin/hello-world-cli
```

## 怎么验证

安装后可以执行：

```bash
hello-world-cli --help
hello-world-cli --version
hello-world-cli open
```

预期输出类似：

```text
hello-world-cli 0.1.0
Mock open: hello-world://open
```

也可以直接确认可执行文件位置：

```bash
which hello-world-cli
```

## 怎么卸载

如果只是想从本机移除这个 mock CLI：

```bash
cargo uninstall hello-world-cli
```

这会删除 Cargo 安装目录里的可执行文件，通常也就是：

```text
~/.cargo/bin/hello-world-cli
```

它不会删除项目里的源码：

```text
crates/hello-world-cli
```

## 和生产分发的关系

这个 mock CLI 现在只用于验证“Rust CLI 包可以安装成本地命令”这条链路。

当前链路是：

```text
crates/hello-world-cli 源码
  -> cargo install --path crates/hello-world-cli --force
  -> 编译 release 可执行文件
  -> 复制到 ~/.cargo/bin/hello-world-cli
  -> 终端直接运行 hello-world-cli
```

未来如果要做真正的 CLI 分发，可以继续往这些方向扩展：

```text
发布到 crates.io，让用户 cargo install hello-world-cli
打包成单独二进制，让用户直接下载
接入 Homebrew，让用户 brew install ...
让 CLI 真正调用 hello-world://open 打开桌面 App
```

当前这一步只是本地 mock，没有发布到线上包仓库，也没有进入 `install.sh`。
