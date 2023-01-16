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

import React from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import Editor from "../../screens/editor";
import EditorOverlay from "../../screens/editor/loading";
import { editorController } from "../../screens/editor/tiptap/utils";
import { eSendEvent, ToastEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useEditorStore } from "../../stores/use-editor-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { useTrashStore } from "../../stores/use-trash-store";
import { eCloseSheet, eOnLoadNote } from "../../utils/events";
import { sleep } from "../../utils/time";
import { Dialog } from "../dialog";
import DialogHeader from "../dialog/dialog-header";
import { presentDialog } from "../dialog/functions";
import { Button } from "../ui/button";
import Paragraph from "../ui/typography/paragraph";

export default function NotePreview({ session, content, note }) {
  const colors = useThemeStore((state) => state.colors);
  const editorId = ":noteHistory";

  async function restore() {
    if (note && note.type === "trash") {
      await db.trash.restore(note.id);
      Navigation.queueRoutesForUpdate(
        "Tags",
        "Notes",
        "Notebooks",
        "Favorites",
        "Trash",
        "TaggedNotes",
        "ColoredNotes",
        "TopicNotes"
      );
      useSelectionStore.getState().setSelectionMode(false);
      ToastEvent.show({
        heading: "Restore successful",
        type: "success"
      });
      eSendEvent(eCloseSheet);
      return;
    }
    await db.noteHistory.restore(session.id);
    if (useEditorStore.getState()?.currentEditingNote === session?.noteId) {
      if (editorController.current?.note) {
        eSendEvent(eOnLoadNote, {
          ...editorController.current?.note,
          forced: true
        });
      }
    }
    eSendEvent(eCloseSheet, "note_history");
    eSendEvent(eCloseSheet);
    Navigation.queueRoutesForUpdate(
      "Notes",
      "Favorites",
      "ColoredNotes",
      "TaggedNotes",
      "TopicNotes"
    );

    ToastEvent.show({
      heading: "Note restored successfully",
      type: "success"
    });
  }

  const deleteNote = async () => {
    presentDialog({
      title: `Delete note permanently`,
      paragraph: `Are you sure you want to delete this note from trash permanentaly`,
      positiveText: "Delete",
      negativeText: "Cancel",
      context: "local",
      positivePress: async () => {
        await db.trash.delete(note.id);
        useTrashStore.getState().setTrash();
        useSelectionStore.getState().setSelectionMode(false);
        ToastEvent.show({
          heading: "Permanantly deleted items",
          type: "success",
          context: "local"
        });
        eSendEvent(eCloseSheet);
      },
      positiveType: "error"
    });
  };

  return (
    <View
      style={{
        height: note?.locked || session?.locked ? null : 600,
        width: "100%"
      }}
    >
      <Dialog context="local" />
      <DialogHeader padding={12} title={note?.title || session?.session} />
      {!session?.locked && !note?.locked ? (
        <View
          style={{
            flex: 1
          }}
        >
          <EditorOverlay editorId={editorId} />
          <Editor
            noHeader
            noToolbar
            readonly
            editorId={editorId}
            onLoad={async () => {
              const _note = note || db.notes.note(session?.noteId)?.data;
              await sleep(1000);
              eSendEvent(eOnLoadNote + editorId, {
                ..._note,
                content: {
                  ...content,
                  isPreview: true
                }
              });
            }}
          />
        </View>
      ) : (
        <View
          style={{
            width: "100%",
            height: 100,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Paragraph color={colors.icon}>
            Preview not available, content is encrypted.
          </Paragraph>
        </View>
      )}

      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        <Button onPress={restore} title="Restore" type="accent" width="100%" />
        <Button
          onPress={deleteNote}
          title="Delete permanently"
          type="error"
          width="100%"
          style={{
            marginTop: 12
          }}
        />
      </View>
    </View>
  );
}
