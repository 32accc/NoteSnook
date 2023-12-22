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

import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import { useRelationStore } from "../../stores/use-relation-store";
import { useTagStore } from "../../stores/use-tag-store";
import { eOnLoadNote, eOnTopicSheetUpdate } from "../../utils/events";
import { openLinkInBrowser } from "../../utils/functions";
import { tabBarRef } from "../../utils/global-refs";
import { editorController, editorState } from "../editor/tiptap/utils";

export function toCamelCase(title: string) {
  if (!title) return "";
  return title.slice(0, 1).toUpperCase() + title.slice(1);
}

export function openMonographsWebpage() {
  try {
    openLinkInBrowser("https://docs.notesnook.com/monographs/");
  } catch (e) {
    console.error(e);
  }
}

export function openEditor() {
  if (!DDS.isTab) {
    if (editorController.current?.note) {
      eSendEvent(eOnLoadNote, { newNote: true });
      editorState().currentlyEditing = true;
      editorState().movedAway = false;
    }
    tabBarRef.current?.goToPage(1);
  } else {
    eSendEvent(eOnLoadNote, { newNote: true });
  }
}

type FirstSaveData = {
  type: string;
  id: string;
  notebook?: string;
};

export const setOnFirstSave = (
  data: {
    type: string;
    id: string;
    notebook?: string;
  } | null
) => {
  if (!data) {
    editorState().onNoteCreated = null;
    return;
  }
  setTimeout(() => {
    editorState().onNoteCreated = (noteId) => onNoteCreated(noteId, data);
  }, 0);
};

export async function onNoteCreated(noteId: string, data: FirstSaveData) {
  if (!data) return;
  switch (data.type) {
    case "notebook": {
      await db.relations?.add(
        { type: "notebook", id: data.id },
        { type: "note", id: noteId }
      );
      editorState().onNoteCreated = null;
      useRelationStore.getState().update();
      break;
    }
    case "topic": {
      if (!data.notebook) break;
      await db.notes?.addToNotebook(
        {
          topic: data.id,
          id: data.notebook
        },
        noteId
      );
      editorState().onNoteCreated = null;
      eSendEvent(eOnTopicSheetUpdate);
      break;
    }
    case "tag": {
      const note = db.notes.note(noteId)?.data;
      const tag = db.tags.tag(data.id);

      if (tag && note) {
        await db.relations.add(tag, note);
      }

      editorState().onNoteCreated = null;
      useTagStore.getState().setTags();
      useRelationStore.getState().update();
      break;
    }
    case "color": {
      const note = db.notes.note(noteId)?.data;
      const color = db.colors.color(data.id);
      if (note && color) {
        await db.relations.add(color, note);
      }
      editorState().onNoteCreated = null;
      useMenuStore.getState().setColorNotes();
      useRelationStore.getState().update();
      break;
    }
    default: {
      break;
    }
  }
  Navigation.queueRoutesForUpdate();
}
