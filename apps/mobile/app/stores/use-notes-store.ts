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
import { NoteType } from "../utils/types";

export interface NoteStore extends State {
  notes: NoteType[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setNotes: (items?: NoteType[]) => void;
  clearNotes: () => void;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  loading: true,
  setLoading: (loading) => set({ loading: loading }),

  setNotes: (items) => {
    if (!items) {
      set({
        notes: groupArray(
          (db.notes?.all as NoteType[]) || [],
          db.settings?.getGroupOptions("home")
        )
      });
      return;
    }
    const prev = get().notes;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = prev.findIndex((v) => v.id === item.id);
      if (index !== -1) {
        prev[index] = item;
      }
    }
    set({ notes: prev });
  },
  clearNotes: () => set({ notes: [] })
}));
