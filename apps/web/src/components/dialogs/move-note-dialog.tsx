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

import { useCallback, useEffect, useState } from "react";
import { Box, Button, Flex, Input, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { db } from "../../common/db";
import Dialog from "./dialog";
import { useStore, store } from "../../stores/notebook-store";
import { store as notestore } from "../../stores/note-store";
import { Perform } from "../../common/dialog-controller";
import { showToast } from "../../utils/toast";
import { pluralize } from "../../utils/string";
import { isMac } from "../../utils/platform";
import { create } from "zustand";
import { FilteredList } from "../filtered-list";

type MoveDialogProps = { onClose: Perform; noteIds: string[] };
type NotebookReference = {
  id: string;
  topic?: string;
  new: boolean;
  op: "add" | "remove";
};
type Item = {
  id: string;
  type: "topic" | "notebook" | "header";
  title: string;
};
type Topic = Item & { notebookId: string };
type Notebook = Item & {
  topics: Topic[];
  dateCreated: number;
  dateModified: number;
};

interface ISelectionStore {
  selected: NotebookReference[];
  isMultiselect: boolean;
  setSelected(refs: NotebookReference[]): void;
  setIsMultiselect(state: boolean): void;
}
export const useSelectionStore = create<ISelectionStore>((set) => ({
  selected: [],
  isMultiselect: false,
  setSelected: (selected) => set({ selected: selected.slice() }),
  setIsMultiselect: (isMultiselect) => set({ isMultiselect })
}));

function MoveDialog({ onClose, noteIds }: MoveDialogProps) {
  const setSelected = useSelectionStore((store) => store.setSelected);
  const setIsMultiselect = useSelectionStore((store) => store.setIsMultiselect);
  const isMultiselect = useSelectionStore((store) => store.isMultiselect);

  const refreshNotebooks = useStore((store) => store.refresh);
  const notebooks = useStore((store) => store.notebooks);
  const getAllNotebooks = useCallback(() => {
    refreshNotebooks();
    return (store.get().notebooks as Notebook[]).filter(
      (a) => a.type !== "header"
    );
  }, [refreshNotebooks]);

  useEffect(() => {
    if (!notebooks) return;

    const selected: NotebookReference[] = useSelectionStore
      .getState()
      .selected.slice();
    for (const notebook of notebooks as Notebook[]) {
      if (notebook.type === "header") continue;
      for (const topic of notebook.topics) {
        const isSelected =
          selected.findIndex(
            (item) => item.id === notebook.id && item.topic === topic.id
          ) > -1;
        if (!isSelected && topicHasNotes(topic, noteIds)) {
          selected.push({
            id: notebook.id,
            topic: topic.id,
            op: "add",
            new: false
          });
        }
      }
    }

    for (const notebook of noteIds
      .map((id) => db.relations?.to({ id, type: "note" }, "notebook"))
      .flat()) {
      const isSelected =
        notebook && selected.findIndex((item) => item.id === notebook.id) > -1;
      if (!notebook || isSelected) continue;

      selected.push({
        id: notebook.id,
        op: "add",
        new: false
      });
    }

    setSelected(selected);
    setIsMultiselect(selected.length > 1);
  }, [noteIds, notebooks, setSelected, setIsMultiselect]);

  const _onClose = useCallback(
    (result: boolean) => {
      setSelected([]);
      setIsMultiselect(false);
      onClose(result);
    },
    [setSelected, setIsMultiselect, onClose]
  );

  return (
    <Dialog
      isOpen={true}
      title={"Select notebooks"}
      description={`Use ${
        isMac() ? "cmd" : "ctrl"
      }+click to select multiple topics`}
      onClose={() => _onClose(false)}
      width={450}
      positiveButton={{
        text: "Done",
        onClick: async () => {
          const { selected } = useSelectionStore.getState();
          for (const item of selected) {
            try {
              if (item.op === "remove") {
                await db.notes?.removeFromNotebook(item, ...noteIds);
              } else if (item.op === "add") {
                await db.notes?.addToNotebook(item, ...noteIds);
              }
            } catch (e) {
              if (e instanceof Error) showToast("error", e.message);
              console.error(e);
            }
          }

          notestore.refresh();

          const stringified = stringifySelected(selected);
          if (stringified) {
            showToast(
              "success",
              `${pluralize(noteIds.length, "note", "notes")} ${stringified}`
            );
          }

          _onClose(true);
        }
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => _onClose(false)
      }}
    >
      {isMultiselect && (
        <Button
          variant="anchor"
          onClick={() => {
            const originalSelection: NotebookReference[] = useSelectionStore
              .getState()
              .selected.filter((a) => !a.new)
              .map((s) => ({ ...s, op: "add" }));
            setSelected(originalSelection);
            setIsMultiselect(originalSelection.length > 1);
          }}
          sx={{ textDecoration: "none", mt: 1 }}
        >
          Reset selection
        </Button>
      )}
      <Flex
        mt={1}
        sx={{ overflowY: "hidden", flexDirection: "column" }}
        data-test-id="notebook-list"
      >
        <FilteredList
          placeholders={{
            empty: "Add a new notebook",
            filter: "Search or add a new notebook"
          }}
          items={getAllNotebooks}
          filter={(notebooks, query) =>
            db.lookup?.notebooks(notebooks, query) || []
          }
          onCreateNewItem={async (title) =>
            await db.notebooks?.add({
              title
            })
          }
          renderItem={(notebook, _index, refresh, isSearching) => (
            <NotebookItem
              key={notebook.id}
              notebook={notebook}
              isSearching={isSearching}
              onCreateItem={async (title) => {
                await db.notebooks?.notebook(notebook.id).topics.add(title);
                refresh();
              }}
            />
          )}
        />
      </Flex>
    </Dialog>
  );
}

function NotebookItem(props: {
  notebook: Notebook;
  isSearching: boolean;
  onCreateItem: (title: string) => void;
}) {
  const { notebook, isSearching, onCreateItem } = props;

  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const setIsMultiselect = useSelectionStore((store) => store.setIsMultiselect);
  const setSelected = useSelectionStore((store) => store.setSelected);
  const isMultiselect = useSelectionStore((store) => store.isMultiselect);

  return (
    <Box as="li" data-test-id="notebook">
      <Box
        as="details"
        sx={{
          "&[open] .arrow-up": { display: "block" },
          "&[open] .arrow-down": { display: "none" },
          "&[open] .title": { fontWeight: "bold" },
          "&[open] .create-topic": { display: "block" }
        }}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        open={isSearching}
      >
        <Flex
          as="summary"
          sx={{
            cursor: "pointer",
            justifyContent: "space-between",
            alignItems: "center",
            bg: "bgSecondary",
            borderRadius: "default",
            p: 1,
            height: "40px"
          }}
        >
          <Flex
            sx={{ alignItems: "center" }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const { selected } = useSelectionStore.getState();

              const isCtrlPressed = e.ctrlKey || e.metaKey;
              if (isCtrlPressed) setIsMultiselect(true);

              if (isMultiselect || isCtrlPressed) {
                setSelected(selectMultiple(notebook, selected));
              } else {
                setSelected(selectSingle(notebook, selected));
              }
            }}
          >
            <SelectedCheck size={20} item={notebook} />
            <Text
              className="title"
              data-test-id="notebook-title"
              variant="subtitle"
              sx={{ fontWeight: "body" }}
            >
              {notebook.title}
              <Text variant="subBody" sx={{ fontWeight: "body" }}>
                {" "}
                ({pluralize(notebook.topics.length, "topic", "topics")})
              </Text>
            </Text>
          </Flex>
          <Flex data-test-id="notebook-tools" sx={{ alignItems: "center" }}>
            <TopicSelectionIndicator notebook={notebook} />
            <Button
              variant="tool"
              className="create-topic"
              data-test-id="create-topic"
              sx={{ display: "none", p: 1 }}
            >
              <Icon.Plus
                size={18}
                title="Add a new topic"
                onClick={() => setIsCreatingNew(true)}
              />
            </Button>
            <Icon.ChevronDown
              className="arrow-down"
              size={20}
              sx={{ height: "20px" }}
            />
            <Icon.ChevronUp
              className="arrow-up"
              size={20}
              sx={{ display: "none", height: "20px" }}
            />
          </Flex>
        </Flex>
        <Box
          as="ul"
          sx={{
            listStyle: "none",
            pl: 4,
            mt: 1,
            gap: "2px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {isCreatingNew && (
            <Flex
              as="li"
              sx={{
                alignItems: "center",
                p: "small"
              }}
            >
              <SelectedCheck />
              <Input
                variant="clean"
                data-test-id={`new-topic-input`}
                autoFocus
                sx={{
                  bg: "bgSecondary",
                  p: "small",
                  border: "1px solid var(--border)"
                }}
                onBlur={() => setIsCreatingNew(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsCreatingNew(false);
                    onCreateItem(e.currentTarget.value);
                  } else if (e.key === "Escape") {
                    setIsCreatingNew(false);
                  }
                }}
              />
            </Flex>
          )}
          {notebook.topics.map((topic) => (
            <TopicItem key={topic.id} topic={topic} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function TopicSelectionIndicator({ notebook }: { notebook: Notebook }) {
  const hasSelectedTopics = useSelectionStore(
    (store) =>
      store.selected.filter((nb) => nb.id === notebook.id && !!nb.topic)
        .length > 0
  );

  if (!hasSelectedTopics) return null;
  return <Icon.Circle size={8} color="primary" sx={{ mr: 1 }} />;
}

function TopicItem(props: { topic: Topic }) {
  const { topic } = props;

  const setSelected = useSelectionStore((store) => store.setSelected);
  const setIsMultiselect = useSelectionStore((store) => store.setIsMultiselect);
  const isMultiselect = useSelectionStore((store) => store.isMultiselect);

  return (
    <Flex
      as="li"
      key={topic.id}
      data-test-id="topic"
      sx={{
        alignItems: "center",
        p: "small",
        borderRadius: "default",
        cursor: "pointer",
        ":hover": { bg: "hover" }
      }}
      onClick={(e) => {
        const { selected } = useSelectionStore.getState();

        const isCtrlPressed = e.ctrlKey || e.metaKey;
        if (isCtrlPressed) setIsMultiselect(true);

        if (isMultiselect || isCtrlPressed) {
          setSelected(selectMultiple(topic, selected));
        } else {
          setSelected(selectSingle(topic, selected));
        }
      }}
    >
      <SelectedCheck item={topic} />
      <Text variant="body" sx={{ fontSize: "subtitle" }}>
        {topic.title}
      </Text>
    </Flex>
  );
}

export default MoveDialog;

function SelectedCheck({
  item,
  size = 20
}: {
  item?: Topic | Notebook;
  size?: number;
}) {
  const selectedItems = useSelectionStore((store) => store.selected);

  const selectedItem =
    item && selectedItems[findSelectionIndex(item, selectedItems)];
  const selected =
    selectedItem?.op === "remove" ? "remove" : selectedItem?.op === "add";

  return selected === true ? (
    <Icon.CheckCircleOutline size={size} sx={{ mr: 1 }} color="primary" />
  ) : selected === null ? (
    <Icon.CheckIntermediate size={size} sx={{ mr: 1 }} color="dimPrimary" />
  ) : selected === "remove" ? (
    <Icon.CheckRemove size={size} sx={{ mr: 1 }} color="error" />
  ) : (
    <Icon.CircleEmpty size={size} sx={{ mr: 1, opacity: 0.4 }} />
  );
}

function createSelection(topic: Topic | Notebook): NotebookReference {
  return {
    id: "notebookId" in topic ? topic.notebookId : topic.id,
    topic: "notebookId" in topic ? topic.id : undefined,
    op: "add",
    new: true
  };
}

function findSelectionIndex(
  topic: Topic | NotebookReference | Notebook,
  array: NotebookReference[]
) {
  return "op" in topic
    ? array.findIndex((a) => a.id === topic.id && a.topic === topic.topic)
    : "notebookId" in topic
    ? array.findIndex((a) => a.id === topic.notebookId && a.topic === topic.id)
    : array.findIndex((a) => a.id === topic.id && !a.topic);
}

function topicHasNotes(topic: Item, noteIds: string[]) {
  const notes: string[] = db.notes?.topicReferences.get(topic.id) || [];
  return noteIds.some((id) => notes.indexOf(id) > -1);
}

function selectMultiple(
  topic: Topic | Notebook,
  selected: NotebookReference[]
) {
  const index = findSelectionIndex(topic, selected);
  const isSelected = index > -1;
  const item = selected[index];

  if (isSelected) {
    // we remove new topics & toggle old ones
    if (item.new) selected.splice(index, 1);
    else item.op = item.op === "add" ? "remove" : "add";
  } else {
    selected.push(createSelection(topic));
  }

  return selected;
}

function selectSingle(topic: Topic | Notebook, array: NotebookReference[]) {
  const selected: NotebookReference[] = array.filter((ref) => !ref.new);

  const index = findSelectionIndex(topic, array);
  const item = array[index];
  const isSelected = index > -1;

  if (isSelected && !item.new) {
    item.op = item.op === "add" ? "remove" : "add";
  } else if (!isSelected) {
    selected.forEach((a) => (a.op = "remove"));
    selected.push(createSelection(topic));
  }

  return selected;
}

function stringifySelected(suggestion: NotebookReference[]) {
  const added = suggestion
    .filter((a) => a.new && a.op === "add")
    .map(resolveReference)
    .filter(Boolean);
  const removed = suggestion
    .filter((a) => a.op === "remove")
    .map(resolveReference)
    .filter(Boolean);
  if (!added.length && !removed.length) return;

  const parts = [];
  if (added.length > 0) parts.push("added to");
  if (added.length >= 1) parts.push(added[0]);
  if (added.length > 1) parts.push(`and ${added.length - 1} others`);

  if (removed.length >= 1) {
    if (parts.length > 0) parts.push("&");
    parts.push("removed from");
    parts.push(removed[0]);
  }
  if (removed.length > 1) parts.push(`and ${removed.length - 1} others`);

  return parts.join(" ") + ".";
}

function resolveReference(ref: NotebookReference): string | undefined {
  const notebook = db.notebooks?.notebook(ref.id);
  if (!notebook) return undefined;

  if (ref.topic) {
    return notebook.topics.topic(ref.topic)?._topic?.title;
  } else {
    return notebook.title;
  }
}
