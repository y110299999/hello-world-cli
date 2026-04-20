fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_deep_link::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
