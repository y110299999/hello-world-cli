use std::env;
use std::process;

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn print_help() {
    println!(
        "\
hello-world-cli {VERSION}

USAGE:
    hello-world-cli [COMMAND]

COMMANDS:
    hello       Print a mock greeting
    open        Pretend to open the Hello World desktop app
    --help      Show this help message
    --version   Show the CLI version"
    );
}

fn main() {
    let mut args = env::args().skip(1);

    match args.next().as_deref() {
        None | Some("hello") => {
            println!("Hello from the mock Rust CLI package.");
        }
        Some("open") => {
            println!("Mock open: hello-world://open");
        }
        Some("--help") | Some("-h") => {
            print_help();
        }
        Some("--version") | Some("-V") => {
            println!("hello-world-cli {VERSION}");
        }
        Some(command) => {
            eprintln!("error: unknown command: {command}");
            eprintln!("run `hello-world-cli --help` for usage");
            process::exit(2);
        }
    }
}
