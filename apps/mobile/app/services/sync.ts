/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import NetInfo from "@react-native-community/netinfo";
import { db } from "../common/database";
import { DatabaseLogger } from "../common/database/index";
import { initAfterSync } from "../stores/index";
import { SyncStatus, useUserStore } from "../stores/use-user-store";
import BackgroundSync from "./background-sync";
import { ToastManager } from "./event-manager";
import SettingsService from "./settings";

export const ignoredMessages = [
  "Sync already running",
  "Not allowed to start service intent",
  "WebSocket failed to connect",
  "Failed to start the HttpConnection before"
];
let pendingSync: any = undefined;
let syncTimer: NodeJS.Timeout;

const run = async (
  context = "global",
  forced = false,
  type: "full" | "send" | "fetch" = "full",
  onCompleted?: (status?: number) => void,
  lastSyncTime?: number
) => {
  if (useUserStore.getState().syncing) {
    DatabaseLogger.info("Sync in progress");
    pendingSync = {
      forced,
      type: type,
      context: context,
      onCompleted,
      lastSyncTime
    };
    return;
  }

  if (pendingSync) {
    pendingSync = undefined;
    DatabaseLogger.info("Running pending sync...");
  }

  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const status = await NetInfo.fetch();
    const userstore = useUserStore.getState();
    const user = await db.user.getUser();
    if (!status.isInternetReachable) {
      DatabaseLogger.warn("Internet not reachable");
    }

    if (
      !user ||
      !status.isInternetReachable ||
      SettingsService.get().disableSync
    ) {
      initAfterSync();
      pendingSync = undefined;
      return onCompleted?.(SyncStatus.Failed);
    }
    userstore.setSyncing(true);

    let error = null;

    try {
      await BackgroundSync.doInBackground(async () => {
        try {
          await db.sync({
            type: type,
            force: forced,
            offlineMode: SettingsService.get().offlineMode
          });
        } catch (e) {
          error = e;
        }
      });

      if (error) {
        throw error;
      }
    } catch (e) {
      error = e;
      if (
        !ignoredMessages.find((message) =>
          (e as Error).message?.includes(message)
        ) &&
        userstore.user &&
        status.isConnected &&
        status.isInternetReachable
      ) {
        userstore.setSyncing(false, SyncStatus.Failed);
        if (status.isConnected && status.isInternetReachable) {
          ToastManager.error(e as Error, "Sync failed", context);
        }
      }

      DatabaseLogger.error(e, "[Client] Failed to sync");
    } finally {
      initAfterSync();
      userstore.setSyncing(
        false,
        error ? SyncStatus.Failed : SyncStatus.Passed
      );
      onCompleted?.(error ? SyncStatus.Failed : SyncStatus.Passed);
      setImmediate(() => {
        if (pendingSync)
          Sync.run(
            pendingSync.context,
            pendingSync.forced,
            pendingSync.type,
            pendingSync.onCompleted,
            pendingSync.lastSyncTime
          );
      });
    }
  }, 300);
};

const Sync = {
  run
};

export default Sync;
