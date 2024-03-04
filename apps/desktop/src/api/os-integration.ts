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

import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { dialog, nativeTheme, Notification, shell } from "electron";
import { AutoLaunch } from "../utils/autolaunch";
import { config, DesktopIntegration } from "../utils/config";
import { bringToFront } from "../utils/bring-to-front";
import { getTheme, setTheme, Theme } from "../utils/theme";
import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import { resolvePath } from "../utils/resolve-path";
import { observable } from "@trpc/server/observable";
import { AssetManager } from "../utils/asset-manager";
import { isFlatpak } from "../utils";
import { setupDesktopIntegration } from "../utils/desktop-integration";

const t = initTRPC.create();

const NotificationOptions = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  silent: z.boolean().optional(),
  timeoutType: z.union([z.literal("default"), z.literal("never")]).optional(),
  urgency: z
    .union([z.literal("normal"), z.literal("critical"), z.literal("low")])
    .optional(),
  tag: z.string()
});

export const osIntegrationRouter = t.router({
  isFlatpak: t.procedure.query(() => isFlatpak()),

  zoomFactor: t.procedure.query(() => config.zoomFactor),
  setZoomFactor: t.procedure.input(z.number()).mutation(({ input: factor }) => {
    globalThis.window?.webContents.setZoomFactor(factor);
    config.zoomFactor = factor;
  }),

  proxyConfig: t.procedure.query(() => config.proxyRules),
  setProxyConfig: t.procedure
    .input(z.string().optional())
    .mutation(({ input: proxyRules }) => {
      globalThis.window?.webContents.session.setProxy({ proxyRules });
      config.proxyRules = proxyRules || "";
    }),

  privacyMode: t.procedure.query(() => config.privacyMode),
  setPrivacyMode: t.procedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(({ input: { enabled } }) => {
      if (!globalThis.window || !["win32", "darwin"].includes(process.platform))
        return;

      globalThis.window.setContentProtection(enabled);

      if (process.platform === "win32") {
        globalThis.window.setThumbnailClip(
          enabled
            ? { x: 0, y: 0, width: 1, height: 1 }
            : { x: 0, y: 0, width: 0, height: 0 }
        );
      }
      config.privacyMode = enabled;
    }),

  desktopIntegration: t.procedure.query(() => config.desktopSettings),
  setDesktopIntegration: t.procedure
    .input(DesktopIntegration)
    .mutation(({ input: settings }) => {
      if (settings.autoStart) {
        AutoLaunch.enable(!!settings.startMinimized);
      } else {
        AutoLaunch.disable();
      }
      config.desktopSettings = settings;
      setupDesktopIntegration(settings);
    }),

  selectDirectory: t.procedure
    .input(
      z.object({
        title: z.string().optional(),
        buttonLabel: z.string().optional(),
        defaultPath: z.string().optional()
      })
    )
    .query(async ({ input }) => {
      if (!globalThis.window) return undefined;

      const { title, buttonLabel, defaultPath } = input;

      const result = await dialog.showOpenDialog(globalThis.window, {
        title,
        buttonLabel,
        properties: ["openDirectory"],
        defaultPath: defaultPath && resolvePath(defaultPath)
      });
      if (result.canceled) return undefined;

      return result.filePaths[0];
    }),

  saveFile: t.procedure
    .input(z.object({ data: z.string(), filePath: z.string() }))
    .query(({ input }) => {
      const { data, filePath } = input;
      if (!data || !filePath) return;

      const resolvedPath = resolvePath(filePath);

      mkdirSync(dirname(resolvedPath), { recursive: true });
      writeFileSync(resolvedPath, data);
    }),

  resolvePath: t.procedure
    .input(z.object({ filePath: z.string() }))
    .query(({ input }) => {
      const { filePath } = input;
      if (!filePath) return;
      return resolvePath(filePath);
    }),

  showNotification: t.procedure
    .input(NotificationOptions)
    .query(({ input }) => {
      const notification = new Notification({
        ...input,
        icon: AssetManager.appIcon({
          size: 64,
          format: process.platform === "win32" ? "ico" : "png"
        })
      });
      notification.show();
      if (input.urgency === "critical") {
        shell.beep();
      }

      return new Promise((resolve) => {
        notification.once("close", () => resolve(undefined));
        notification.once("click", () => resolve(input.tag));
      });
    }),
  openPath: t.procedure
    .input(z.object({ type: z.literal("path"), link: z.string() }))
    .query(({ input }) => {
      const { type, link } = input;
      if (type === "path") return shell.openPath(resolvePath(link));
    }),
  bringToFront: t.procedure.query(() => bringToFront()),
  changeTheme: t.procedure
    .input(Theme)
    .mutation(({ input }) => setTheme(input)),

  onThemeChanged: t.procedure.subscription(() =>
    observable<"dark" | "light">((emit) => {
      nativeTheme.on("updated", () => {
        if (getTheme() === "system") {
          emit.next(nativeTheme.shouldUseDarkColors ? "dark" : "light");
        }
      });
    })
  )
});
