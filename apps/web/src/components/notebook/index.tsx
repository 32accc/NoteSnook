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
import { Flex, Text } from "@theme-ui/components";
import ListItem from "../list-item";
import { useStore, store } from "../../stores/notebook-store";
import { store as appStore } from "../../stores/app-store";
import { showUnpinnedToast } from "../../common/toasts";
import { db } from "../../common/db";
import {
  Topic as TopicIcon,
  PinFilled,
  NotebookEdit,
  Notebook as NotebookIcon,
  Pin,
  RemoveShortcutLink,
  Shortcut,
  Trash
} from "../icons";
import { hashNavigate, navigate } from "../../navigation";
import IconTag from "../icon-tag";
import { showToast } from "../../utils/toast";
import { Multiselect } from "../../common/multi-select";
import { pluralize } from "@notesnook/common";
import { confirm } from "../../common/dialog-controller";
import { getFormattedDate } from "@notesnook/common";
import { MenuItem } from "@notesnook/ui";
import { Note, Notebook } from "@notesnook/core/dist/types";

type NotebookProps = {
  item: Notebook;
  totalNotes: number;
  date: number;
  simplified?: boolean;
};
function Notebook(props: NotebookProps) {
  const { item, totalNotes, date, simplified } = props;
  const notebook = item;
  const isCompact = useStore((store) => store.viewMode === "compact");

  return (
    <ListItem
      isCompact={isCompact}
      isSimple={simplified}
      item={notebook}
      onClick={() => {
        navigate(`/notebooks/${notebook.id}`);
      }}
      title={notebook.title}
      body={notebook.description as string}
      menuItems={menuItems}
      footer={
        <>
          {isCompact ? (
            <>
              <Text variant="subBody">{pluralize(totalNotes, "note")}</Text>
            </>
          ) : (
            <>
              {notebook?.topics && (
                <Flex mb={1} sx={{ gap: 1 }}>
                  {notebook.topics.slice(0, 3).map((topic) => (
                    <IconTag
                      key={topic.id}
                      text={topic.title}
                      icon={TopicIcon}
                      onClick={() => {
                        navigate(`/notebooks/${notebook.id}/${topic.id}`);
                      }}
                    />
                  ))}
                </Flex>
              )}
              <Flex
                sx={{
                  fontSize: "subBody",
                  color: "var(--paragraph-secondary)",
                  alignItems: "center",
                  fontFamily: "body"
                }}
              >
                {notebook.pinned && (
                  <PinFilled color="accent" size={13} sx={{ mr: 1 }} />
                )}

                {getFormattedDate(date, "date")}
                <Text as="span" mx={1} sx={{ color: "inherit" }}>
                  •
                </Text>
                <Text sx={{ color: "inherit" }}>
                  {pluralize(totalNotes, "note")}
                </Text>
              </Flex>
            </>
          )}
        </>
      }
    />
  );
}
export default React.memo(Notebook, (prev, next) => {
  const prevItem = prev.item;
  const nextItem = next.item;

  return (
    prev.date === next.date &&
    prevItem.pinned === nextItem.pinned &&
    prevItem.title === nextItem.title &&
    prevItem.description === nextItem.description &&
    prev.totalNotes === next.totalNotes
  );
});

const pin = (notebook: Notebook) => {
  return store
    .pin(notebook.id)
    .then(() => {
      if (notebook.pinned) showUnpinnedToast(notebook.id, "notebook");
    })
    .catch((error) => showToast("error", error.message));
};

const menuItems: (notebook: Notebook, items?: Notebook[]) => MenuItem[] = (
  notebook,
  items = []
) => {
  const defaultNotebook = db.settings.getDefaultNotebook();

  return [
    {
      type: "button",
      key: "edit",
      title: "Edit",
      icon: NotebookEdit.path,
      onClick: () => hashNavigate(`/notebooks/${notebook.id}/edit`)
    },
    {
      type: "button",
      key: "set-as-default",
      title: "Set as default",
      isChecked: defaultNotebook?.id === notebook.id && !defaultNotebook?.topic,
      icon: NotebookIcon.path,
      onClick: async () => {
        const defaultNotebook = db.settings.getDefaultNotebook();
        const isDefault =
          defaultNotebook?.id === notebook.id && !defaultNotebook?.topic;
        await db.settings.setDefaultNotebook(
          isDefault ? undefined : { id: notebook.id }
        );
      }
    },
    {
      type: "button",
      key: "pin",
      icon: Pin.path,
      title: "Pin",
      isChecked: notebook.pinned,
      onClick: () => pin(notebook)
    },
    {
      type: "button",
      key: "shortcut",
      icon: db.shortcuts.exists(notebook.id)
        ? RemoveShortcutLink.path
        : Shortcut.path,
      title: db.shortcuts.exists(notebook.id)
        ? "Remove shortcut"
        : "Create shortcut",
      onClick: () => appStore.addToShortcuts(notebook)
    },
    { key: "sep", type: "separator" },
    {
      type: "button",
      key: "movetotrash",
      title: "Move to trash",
      variant: "dangerous",
      icon: Trash.path,
      onClick: async () => {
        const result = await confirm({
          title: `Delete ${pluralize(items.length, "notebook")}?`,
          positiveButtonText: `Yes`,
          negativeButtonText: "No",
          checks: {
            deleteContainingNotes: {
              text: `Move all notes in ${
                items.length > 1 ? "these notebooks" : "this notebook"
              } to trash`
            }
          }
        });

        if (result) {
          if (result.deleteContainingNotes) {
            const notes: Note[] = [];
            for (const item of items) {
              notes.push(...(db.relations.from(item, "note").resolved() || []));
              const topics = db.notebooks.topics(item.id);
              if (!topics) return;
              for (const topic of topics.all) {
                notes.push(...(topics.topic(topic.id)?.all || []));
              }
            }
            await Multiselect.moveNotesToTrash(notes, false);
          }
          await Multiselect.moveNotebooksToTrash(items);
        }
      },
      multiSelect: true
    }
  ];
};
