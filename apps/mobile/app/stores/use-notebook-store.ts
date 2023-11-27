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

import { groupArray } from "@notesnook/core/dist/utils/grouping";
import create, { State } from "zustand";
import { db } from "../common/database";
import { NotebookType } from "../utils/types";
export interface NotebookStore extends State {
  notebooks: NotebookType[];
  setNotebooks: (items?: NotebookType[]) => void;
  clearNotebooks: () => void;
}

export const useNotebookStore = create<NotebookStore>((set, get) => ({
  notebooks: [],
  setNotebooks: (items) => {
    if (!items) {
      set({
        notebooks: groupArray(
          (db?.notebooks?.all as NotebookType[]) || [],
          db.settings.getGroupOptions("notebooks")
        )
      });
      return;
    }
    const prev = get().notebooks;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = prev.findIndex((v) => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ notebooks: prev });
  },
  clearNotebooks: () => set({ notebooks: [] })
}));
