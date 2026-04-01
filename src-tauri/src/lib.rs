use tauri::{Emitter, Manager, Runtime};
use tauri::window::Color;
use tauri::menu::{IsMenuItem, Menu, MenuItem};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

fn spawn_cmd(program: &str, args: &[&str]) -> Result<(), String> {
    std::process::Command::new(program)
        .args(args)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// ── Power commands (Windows) ─────────────────────────────────
#[tauri::command]
fn shutdown_system() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        spawn_cmd("shutdown", &["/s", "/t", "0"])
    }

    #[cfg(not(target_os = "windows"))]
    Err("shutdown is only supported on Windows".into())
}

#[tauri::command]
fn restart_system() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        spawn_cmd("shutdown", &["/r", "/t", "0"])
    }

    #[cfg(not(target_os = "windows"))]
    Err("restart is only supported on Windows".into())
}

#[tauri::command]
fn hibernate_system() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        spawn_cmd("shutdown", &["/h"])
    }

    #[cfg(not(target_os = "windows"))]
    Err("hibernate is only supported on Windows".into())
}

#[tauri::command]
fn sleep_system() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        spawn_cmd("rundll32.exe", &["powrprof.dll,SetSuspendState", "0,1,0"])
    }

    #[cfg(not(target_os = "windows"))]
    Err("sleep is only supported on Windows".into())
}

#[tauri::command]
fn lock_screen() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        spawn_cmd("rundll32.exe", &["user32.dll,LockWorkStation"])
    }

    #[cfg(not(target_os = "windows"))]
    Err("lock screen is only supported on Windows".into())
}

#[tauri::command]
fn logoff_user() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        spawn_cmd("shutdown", &["/l"])
    }

    #[cfg(not(target_os = "windows"))]
    Err("log off is only supported on Windows".into())
}

// ── Battery info ─────────────────────────────────────────────
#[derive(serde::Serialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
struct BatteryInfo {
    present: bool,
    level: Option<u32>,
    charging: bool,
    plugged: bool,
    is_low: bool,
    is_critical: bool,
}

#[cfg(target_os = "windows")]
fn query_battery_info() -> BatteryInfo {
    use windows_sys::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};

    let mut status = SYSTEM_POWER_STATUS {
        ACLineStatus: 255,
        BatteryFlag: 255,
        BatteryLifePercent: 255,
        SystemStatusFlag: 0,
        BatteryLifeTime: 0,
        BatteryFullLifeTime: 0,
    };

    let ok = unsafe { GetSystemPowerStatus(&mut status as *mut _) } != 0;
    if !ok {
        return BatteryInfo {
            present: false,
            level: None,
            charging: false,
            plugged: false,
            is_low: false,
            is_critical: false,
        };
    }

    let present = (status.BatteryFlag & 128) == 0;
    let level = if present && status.BatteryLifePercent != 255 {
        Some(status.BatteryLifePercent as u32)
    } else {
        None
    };

    BatteryInfo {
        present,
        level,
        plugged: status.ACLineStatus == 1,
        charging: present && (status.BatteryFlag & 8) != 0,
        is_low: present && (status.BatteryFlag & 2) != 0,
        is_critical: present && (status.BatteryFlag & 4) != 0,
    }
}

#[cfg(not(target_os = "windows"))]
fn query_battery_info() -> BatteryInfo {
    BatteryInfo {
        present: false,
        level: None,
        charging: false,
        plugged: false,
        is_low: false,
        is_critical: false,
    }
}

#[tauri::command]
fn get_battery_info() -> BatteryInfo {
    query_battery_info()
}

// ── System info ───────────────────────────────────────────────────────────────
#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SystemInfo {
    os: String,
    uptime_seconds: u64,
    cpu_usage: f32,
    memory_used: u64,
    memory_total: u64,
}

fn system() -> &'static Mutex<sysinfo::System> {
    static SYS: OnceLock<Mutex<sysinfo::System>> = OnceLock::new();
    SYS.get_or_init(|| {
        let refresh = sysinfo::RefreshKind::nothing()
            .with_memory(sysinfo::MemoryRefreshKind::everything())
            .with_cpu(sysinfo::CpuRefreshKind::nothing().with_cpu_usage());
        Mutex::new(sysinfo::System::new_with_specifics(refresh))
    })
}

#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    let mut sys = system()
        .lock()
        .map_err(|_| "system info lock poisoned".to_string())?;

    sys.refresh_memory();
    sys.refresh_cpu_usage();

    let os = sysinfo::System::long_os_version()
        .or_else(sysinfo::System::name)
        .unwrap_or_else(|| "Unknown".to_string());

    Ok(SystemInfo {
        os,
        uptime_seconds: sysinfo::System::uptime(),
        cpu_usage: sys.global_cpu_usage(),
        memory_used: sys.used_memory().saturating_mul(1024),
        memory_total: sys.total_memory().saturating_mul(1024),
    })
}

// ── Window management ────────────────────────────────────────
#[tauri::command]
fn main_window(app: &tauri::AppHandle) -> Result<tauri::WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())
}

#[cfg(target_os = "windows")]
fn apply_overlay_region(win: &tauri::WebviewWindow) {
    use windows_sys::Win32::Foundation::HWND as SYS_HWND;
    use windows_sys::Win32::Graphics::Gdi::SetWindowRgn;

    if let Ok(hwnd) = win.hwnd() {
        let hwnd = hwnd.0 as isize;
        unsafe {
            let _ = SetWindowRgn(hwnd as SYS_HWND, std::ptr::null_mut(), 1);
        }
    }
}

#[tauri::command]
fn minimize_to_overlay(app: tauri::AppHandle, mode: String, size: u32) -> Result<(), String> {
    let win = main_window(&app)?;
    let _ = win.show();
    let _ = win.unminimize();

    win.set_decorations(false).map_err(|e| e.to_string())?;
    win.set_always_on_top(true).map_err(|e| e.to_string())?;
    let _ = win.set_shadow(false);
    let _ = win.set_background_color(Some(Color(0, 0, 0, 0)));
    let _ = win.set_resizable(false);
    let _ = win.set_skip_taskbar(true);

    let size = size.clamp(100, 420);
    let pad = 0;
    let (width, height) = match mode.as_str() {
        "digital" => (size + pad, (size * 11) / 10 + pad),
        "analog" => (size + pad, size + pad),
        _ => (size + pad, size + pad),
    };
    win.set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }))
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        apply_overlay_region(&win);
    }

    Ok(())
}

#[tauri::command]
fn set_overlay_bounds(
    app: tauri::AppHandle,
    _mode: String,
    width: u32,
    height: u32,
) -> Result<(), String> {
    let win = main_window(&app)?;
    let _ = win.show();
    let _ = win.unminimize();

    win.set_decorations(false).map_err(|e| e.to_string())?;
    win.set_always_on_top(true).map_err(|e| e.to_string())?;
    let _ = win.set_shadow(false);
    let _ = win.set_background_color(Some(Color(0, 0, 0, 0)));
    let _ = win.set_resizable(false);
    let _ = win.set_skip_taskbar(true);

    let width = width.clamp(80, 520);
    let height = height.clamp(80, 640);
    win.set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }))
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        apply_overlay_region(&win);
    }

    Ok(())
}

#[tauri::command]
fn restore_from_overlay(app: tauri::AppHandle) -> Result<(), String> {
    let win = main_window(&app)?;
    win.set_always_on_top(false).map_err(|e| e.to_string())?;
    win.set_decorations(false).map_err(|e| e.to_string())?;
    let _ = win.set_shadow(true);
    let _ = win.set_background_color(Some(Color(10, 12, 16, 255)));
    let _ = win.set_resizable(true);
    let _ = win.set_skip_taskbar(false);
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::Graphics::Gdi::SetWindowRgn;
        use windows_sys::Win32::Foundation::HWND as SYS_HWND;
        if let Ok(hwnd) = win.hwnd() {
            let hwnd = hwnd.0 as isize;
            unsafe {
                let _ = SetWindowRgn(hwnd as SYS_HWND, std::ptr::null_mut(), 1);
            }
        }
    }
    win.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: 980,
        height: 680,
    }))
    .map_err(|e| e.to_string())?;
    let _ = win.center();

    Ok(())
}

#[tauri::command]
fn window_minimize(app: tauri::AppHandle) -> Result<(), String> {
    hide_main_window(app)
}

#[tauri::command]
fn start_dragging(app: tauri::AppHandle) -> Result<(), String> {
    main_window(&app)?.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_overlay_position(app: tauri::AppHandle, x: i32, y: i32) -> Result<(), String> {
    let win = main_window(&app)?;
    let size = win.outer_size().map_err(|e| e.to_string())?;

    let mut target_x = x;
    let mut target_y = y;

    if let Ok(Some(monitor)) = win.current_monitor() {
        let msize = monitor.size();
        let max_x = (msize.width as i32).saturating_sub(size.width as i32);
        let max_y = (msize.height as i32).saturating_sub(size.height as i32);
        target_x = target_x.clamp(0, max_x.max(0));
        target_y = target_y.clamp(0, max_y.max(0));
    }

    win.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
        x: target_x,
        y: target_y,
    }))
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_window_position(app: tauri::AppHandle) -> Result<(i32, i32), String> {
    let win = main_window(&app)?;
    let pos = win.outer_position().map_err(|e| e.to_string())?;
    Ok((pos.x, pos.y))
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let win = main_window(&app)?;
    win.show().map_err(|e| e.to_string())?;
    win.set_focus().map_err(|e| e.to_string())?;
    if let Some(splash) = app.get_webview_window("splashscreen") {
        let _ = splash.close();
    }
    Ok(())
}

#[tauri::command]
fn close_splashscreen(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("splashscreen") {
        let _ = win.close();
    }
    Ok(())
}

#[tauri::command]
fn hide_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let win = main_window(&app)?;
    win.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn window_toggle_maximize(app: tauri::AppHandle) -> Result<(), String> {
    let win = main_window(&app)?;
    let is_max = win.is_maximized().map_err(|e| e.to_string())?;
    if is_max {
        win.unmaximize().map_err(|e| e.to_string())
    } else {
        win.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn window_close(app: tauri::AppHandle) -> Result<(), String> {
    hide_main_window(app)
}

// ── Notification ─────────────────────────────────────────────
#[tauri::command]
fn send_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    let _ = (title, body);
    let win = main_window(&app)?;
    let visible = win.is_visible().unwrap_or(true);
    if !visible {
        let _ = win.show();
    }
    let _ = win.set_focus();
    let _ = win.request_user_attention(Some(tauri::UserAttentionType::Informational));
    Ok(())
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

const TRAY_ID: &str = "main";

fn build_tray_menu<R: Runtime>(
    app: &tauri::AppHandle<R>,
    enabled_rules: u32,
) -> Result<Menu<R>, String> {
    let open = MenuItem::with_id(app, "open", "⊞ Open PoHtimer", true, None::<&str>)
        .map_err(|e| e.to_string())?;
    let new_timer =
        MenuItem::with_id(app, "new_timer", "◷ New Timer", true, None::<&str>)
            .map_err(|e| e.to_string())?;

    let mut items: Vec<MenuItem<R>> = vec![open, new_timer];

    if enabled_rules > 0 {
        let label = format!("⚡ Battery Rules Enabled ({})", enabled_rules);
        let battery_rules =
            MenuItem::with_id(app, "battery_rules", label, true, None::<&str>)
                .map_err(|e| e.to_string())?;
        items.push(battery_rules);
    }

    let quit = MenuItem::with_id(app, "quit", "✕ Exit", true, None::<&str>)
        .map_err(|e| e.to_string())?;
    items.push(quit);

    let mut refs: Vec<&dyn IsMenuItem<R>> = Vec::new();
    for item in &items {
        refs.push(item);
    }
    Menu::with_items(app, &refs).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_tray_menu(app: tauri::AppHandle, enabled_rules: u32) -> Result<(), String> {
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or_else(|| "tray icon not found".to_string())?;
    let menu = build_tray_menu(&app, enabled_rules)?;
    tray.set_menu(Some(menu)).map_err(|e| e.to_string())
}

// ── Autostart ────────────────────────────────────────────────
#[tauri::command]
fn set_autostart(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;

        const VALUE_NAME: &str = "PoHTimer";
        const RUN_KEY: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (key, _) = hkcu.create_subkey(RUN_KEY).map_err(|e| e.to_string())?;

        if enabled {
            let exe = std::env::current_exe().map_err(|e| e.to_string())?;
            let exe = exe.to_string_lossy();
            let value = format!("\"{}\"", exe);
            key.set_value(VALUE_NAME, &value)
                .map_err(|e| e.to_string())?;
        } else {
            let _ = key.delete_value(VALUE_NAME);
        }

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    Err("autostart is only supported on Windows".into())
}

#[tauri::command]
fn get_autostart_enabled() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;

        const VALUE_NAME: &str = "PoHTimer";
        const RUN_KEY: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let Ok(key) = hkcu.open_subkey(RUN_KEY) else {
            return Ok(false);
        };
        let val: Result<String, _> = key.get_value(VALUE_NAME);
        Ok(val.is_ok())
    }

    #[cfg(not(target_os = "windows"))]
    Ok(false)
}

// ── App entry ────────────────────────────────────────────────
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let menu = build_tray_menu(app.handle(), 0)?;

            let icon = app
                .default_window_icon()
                .cloned()
                .ok_or_else(|| "missing tray icon".to_string())?;

            TrayIconBuilder::with_id(TRAY_ID)
                .icon(icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("PoHtimer")
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        let _ = show_main_window(app.clone());
                        let _ = app.emit("poh://restore-app", ());
                        let _ = app.emit("poh://open-view", serde_json::json!({"view":"dashboard"}));
                    }
                    "new_timer" => {
                        let _ = show_main_window(app.clone());
                        let _ = app.emit("poh://restore-app", ());
                        let _ = app.emit("poh://open-view", serde_json::json!({"view":"timer","create":true}));
                    }
                    "battery_rules" => {
                        let _ = show_main_window(app.clone());
                        let _ = app.emit("poh://restore-app", ());
                        let _ = app.emit("poh://open-view", serde_json::json!({"view":"battery"}));
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::DoubleClick { button, .. } = event {
                        if button == MouseButton::Left {
                            let app = tray.app_handle().clone();
                            let _ = show_main_window(app.clone());
                            let _ = app.emit("poh://restore-app", ());
                        }
                    }
                })
                .build(app)?;

            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(3500));
                if let Some(main) = app_handle.get_webview_window("main") {
                    if !main.is_visible().unwrap_or(true) {
                        let _ = main.show();
                    }
                    let _ = main.set_focus();
                }
                if let Some(splash) = app_handle.get_webview_window("splashscreen") {
                    let _ = splash.close();
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            shutdown_system,
            restart_system,
            hibernate_system,
            sleep_system,
            lock_screen,
            logoff_user,
            get_battery_info,
            get_system_info,
            minimize_to_overlay,
            set_overlay_bounds,
            restore_from_overlay,
            window_minimize,
            start_dragging,
            set_overlay_position,
            get_window_position,
            show_main_window,
            close_splashscreen,
            hide_main_window,
            window_toggle_maximize,
            window_close,
            send_notification,
            exit_app,
            update_tray_menu,
            set_autostart,
            get_autostart_enabled,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() != "main" {
                    return;
                }
                api.prevent_close();
                let _ = window.emit("poh://close-requested", ());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
