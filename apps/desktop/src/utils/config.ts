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

import { nativeTheme } from "electron";
import { JSONStorage } from "./json-storage";
import { z } from "zod";

export const DesktopIntegration = z.object({
  autoStart: z.boolean(),
  startMinimized: z.boolean(),
  minimizeToSystemTray: z.boolean(),
  closeToSystemTray: z.boolean()
});

export type DesktopIntegration = z.infer<typeof DesktopIntegration>;

export const config = {
  desktopSettings: <DesktopIntegration>{
    autoStart: false,
    startMinimized: false,
    minimizeToSystemTray: false,
    closeToSystemTray: false
  },
  privacyMode: false,
  isSpellCheckerEnabled: false,
  zoomFactor: 0,
  theme: nativeTheme.themeSource
};

type ConfigKey = keyof typeof config;
for (const key in config) {
  const defaultValue = config[<ConfigKey>key];
  if (Object.hasOwn(config, key)) {
    Object.defineProperty(config, key, {
      get: () => JSONStorage.get(key, defaultValue),
      set: (value) => JSONStorage.set(key, value)
    });
  }
}
