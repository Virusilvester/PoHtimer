// Tauri commands bridge
// In production these call actual Tauri backend; in browser they simulate

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function invokeCommand<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<T>(cmd, args);
  }
  // Browser simulation
  console.log(`[Tauri Sim] invoke: ${cmd}`, args);
  return undefined as T;
}

export const TauriCommands = {
  async shutdown() {
    return invokeCommand("shutdown_system");
  },
  async restart() {
    return invokeCommand("restart_system");
  },
  async hibernate() {
    return invokeCommand("hibernate_system");
  },
  async sleep() {
    return invokeCommand("sleep_system");
  },
  async lockScreen() {
    return invokeCommand("lock_screen");
  },
  async logoff() {
    return invokeCommand("logoff_user");
  },

  async getBatteryInfo(): Promise<{
    present: boolean;
    level?: number;
    charging: boolean;
    plugged: boolean;
    isLow: boolean;
    isCritical: boolean;
  }> {
    if (isTauri()) {
      return invokeCommand("get_battery_info");
    }
    // Simulate battery via Web Battery API or mock
    if ("getBattery" in navigator) {
      const battery = await (navigator as any).getBattery();
      const level = Math.round(battery.level * 100);
      return {
        present: true,
        level,
        charging: battery.charging,
        plugged: battery.charging,
        isLow: level <= 20 && !battery.charging,
        isCritical: level <= 10 && !battery.charging,
      };
    }
    return {
      present: false,
      level: undefined,
      charging: false,
      plugged: true,
      isLow: false,
      isCritical: false,
    };
  },

  async minimizeToOverlay(mode: "digital" | "analog", size: number) {
    return invokeCommand("minimize_to_overlay", { mode, size });
  },

  async setOverlayBounds(mode: "digital" | "analog", width: number, height: number) {
    return invokeCommand("set_overlay_bounds", { mode, width, height });
  },

  async restoreFromOverlay() {
    return invokeCommand("restore_from_overlay");
  },

  async windowMinimize() {
    return invokeCommand("window_minimize");
  },

  async windowToggleMaximize() {
    return invokeCommand("window_toggle_maximize");
  },

  async windowClose() {
    return invokeCommand("window_close");
  },

  async startDragging() {
    return invokeCommand("start_dragging");
  },

  async exitApp() {
    return invokeCommand("exit_app");
  },

  async updateTrayMenu(enabledRules: number) {
    return invokeCommand("update_tray_menu", { enabledRules });
  },

  async setAutostart(enabled: boolean) {
    return invokeCommand("set_autostart", { enabled });
  },

  async getAutostartEnabled(): Promise<boolean> {
    if (isTauri()) return invokeCommand("get_autostart_enabled");
    return false;
  },

  async getSystemInfo(): Promise<{
    os: string;
    uptimeSeconds: number;
    cpuUsage: number;
    memoryUsed: number;
    memoryTotal: number;
  }> {
    if (isTauri()) return invokeCommand("get_system_info");

    const os = navigator.userAgent;
    const uptimeSeconds = Math.floor(performance.now() / 1000);
    const memoryTotal =
      (performance as any).memory?.jsHeapSizeLimit ?? 0;
    const memoryUsed =
      (performance as any).memory?.usedJSHeapSize ?? 0;

    return {
      os,
      uptimeSeconds,
      cpuUsage: 0,
      memoryUsed,
      memoryTotal,
    };
  },

  async sendNotification(title: string, body: string) {
    if (isTauri()) {
      return invokeCommand("send_notification", { title, body });
    }
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  },
};

export type {};
