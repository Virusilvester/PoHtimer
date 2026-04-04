import type { PowerAction } from "./store";
import { TauriCommands } from "./tauricommands";

export async function executePowerAction(action: PowerAction): Promise<void> {
  switch (action) {
    case "shutdown":
      await TauriCommands.shutdown();
      return;
    case "restart":
      await TauriCommands.restart();
      return;
    case "hibernate":
      await TauriCommands.hibernate();
      return;
    case "sleep":
      await TauriCommands.sleep();
      return;
    case "lock":
      await TauriCommands.lockScreen();
      return;
    case "logoff":
      await TauriCommands.logoff();
      return;
    case "none":
      return;
  }
}
