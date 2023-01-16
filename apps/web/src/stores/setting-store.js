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

import createStore from "../common/store";
import Config from "../utils/config";
import BaseStore from "./index";

class SettingStore extends BaseStore {
  encryptBackups = Config.get("encryptBackups", false);
  doubleSpacedLines = Config.get("doubleSpacedLines", true);

  setEncryptBackups = (encryptBackups) => {
    this.set((state) => (state.encryptBackups = encryptBackups));
    Config.set("encryptBackups", encryptBackups);
  };

  toggleEncryptBackups = () => {
    const encryptBackups = this.get().encryptBackups;
    this.setEncryptBackups(!encryptBackups);
  };

  toggleDoubleSpacedLines = () => {
    const doubleSpacedLines = this.get().doubleSpacedLines;
    this.set((state) => (state.doubleSpacedLines = !doubleSpacedLines));
    Config.set("doubleSpacedLines", !doubleSpacedLines);
  };
}

/**
 * @type {[import("zustand").UseStore<SettingStore>, SettingStore]}
 */
const [useStore, store] = createStore(SettingStore);
export { useStore, store };
