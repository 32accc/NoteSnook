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

import { EVENTS } from "@notesnook/desktop";
import { AppEventManager } from "../common/app-events";
import { desktop } from "../common/desktop-client";
import { isDesktop } from "./platform";
import { appVersion, getServiceWorkerVersion } from "./version";

export async function checkForUpdate() {
  if (isDesktop()) await desktop.updater.check.query();
  else {
    AppEventManager.publish(EVENTS.checkingForUpdate);

    const registrations =
      (await navigator.serviceWorker?.getRegistrations()) || [];
    for (const registration of registrations) {
      await registration.update();
      if (registration.waiting) {
        const workerVersion = await getServiceWorkerVersion(
          registration.waiting
        );
        if (!workerVersion || workerVersion.numerical <= appVersion.numerical) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          continue;
        }

        AppEventManager.publish(EVENTS.updateDownloadCompleted, {
          version: workerVersion.formatted
        });
        return;
      }
    }

    AppEventManager.publish(EVENTS.updateNotAvailable);
  }
}

export async function downloadUpdate() {
  if (isDesktop()) await desktop.updater.download.query();
  else {
    console.log("Force updating");
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  }
}

export async function installUpdate() {
  if (isDesktop()) await desktop.updater.install.query();
  else {
    const registrations =
      (await navigator.serviceWorker?.getRegistrations()) || [];
    let reload = false;
    for (const registration of registrations) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        reload = true;
      }
    }
    if (reload) window.location.reload();
  }
}
