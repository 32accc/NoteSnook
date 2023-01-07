/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { useCallback, useMemo, useState } from "react";
import { Button, Flex, Input, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { db } from "../../common/db";
import Dialog from "./dialog";
import { useStore, store } from "../../stores/notebook-store";
import { store as notestore } from "../../stores/note-store";
import { Perform } from "../../common/dialog-controller";
import { ThemeUIStyleObject } from "@theme-ui/core";
import { showToast } from "../../utils/toast";
import { pluralize } from "../../utils/string";
import FilteredList, { Item } from "../filtered-list";

type MoveDialogProps = { onClose: Perform; noteIds: string[] };
type NotebookReference = { id: string; topic: string; type: "add" | "remove" };
type Notebook = Item & { topics: Item[] };

function MoveDialog({ onClose, noteIds }: MoveDialogProps) {
  const [selected, setSelected] = useState<NotebookReference[]>([]);

  const refreshNotebooks = useStore((store) => store.refresh);
  const getAllNotebooks = useCallback(() => {
    refreshNotebooks();
    return (store.get().notebooks as Notebook[]).filter(
      (a) => a.type !== "header"
    );
  }, [refreshNotebooks]);

  return (
    <Dialog
      isOpen={true}
      title={"Add to notebook"}
      description={"You can add a single note to multiple notebooks & topics."}
      onClose={onClose}
      width={"30%"}
      positiveButton={{
        text: "Finish",
        disabled: !selected.length,
        onClick: async () => {
          for (const item of selected) {
            try {
              if (item.type === "remove") {
                await db.notes?.removeFromNotebook(item, ...noteIds);
              } else if (item.type === "add") {
                await db.notes?.addToNotebook(item, ...noteIds);
              }
            } catch (e) {
              if (e instanceof Error) showToast("error", e.message);
              console.error(e);
            }
          }
          notestore.refresh();
          const addedTopics = selected.filter((a) => a.type === "add").length;
          const removedTopics = selected.filter(
            (a) => a.type === "remove"
          ).length;
          if (addedTopics)
            showToast(
              "success",
              `Added ${pluralize(
                noteIds.length,
                "note",
                "notes"
              )} to ${pluralize(addedTopics, "topic", "topics")}`
            );
          if (removedTopics)
            showToast(
              "success",
              `Removed ${pluralize(
                noteIds.length,
                "note",
                "notes"
              )} from ${pluralize(removedTopics, "topic", "topics")}`
            );
          onClose(true);
        }
      }}
      negativeButton={{
        text: "Cancel",
        onClick: onClose
      }}
    >
      <Flex
        mt={1}
        sx={{ overflowY: "hidden", flexDirection: "column" }}
        data-test-id="notebook-list"
      >
        <FilteredList
          placeholders={{
            empty: "Add a new notebook",
            filter: "Filter notebooks"
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
          renderItem={(notebook, _index, refresh) => {
            return (
              <TreeNode
                item={notebook}
                items={notebook.topics}
                placeholder={
                  <Text
                    variant="body"
                    sx={{ color: "fontTertiary", textAlign: "center" }}
                  >
                    {"You have no topics in this notebook."}
                  </Text>
                }
                isSelected={(item) => {
                  if (item.type === "notebook") {
                    return notebook.topics.some((topic) =>
                      topicHasNotes(topic, noteIds)
                    );
                  } else if (item.type === "topic") {
                    const selectedItem = selected.find(
                      (t) => t.topic === item.id
                    );
                    if (selectedItem?.type === "remove") return false;
                    return (
                      selectedItem?.type === "add" ||
                      topicHasNotes(item, noteIds)
                    );
                  }
                  return false;
                }}
                onSelected={(topic) => {
                  if (!topic) return;

                  const opType = topicHasNotes(topic, noteIds)
                    ? "remove"
                    : "add";
                  setSelected((s) => {
                    const copy = s.slice();
                    const index = copy.findIndex((i) => i.topic === topic.id);
                    if (index === -1)
                      copy.push({
                        id: notebook.id,
                        topic: topic.id,
                        type: opType
                      });
                    else copy.splice(index, 1);
                    return copy;
                  });
                }}
                onCreateItem={async (title) => {
                  await db.notebooks?.notebook(notebook.id).topics.add(title);
                  refresh();
                }}
              />
            );
          }}
        />
      </Flex>
    </Dialog>
  );
}

function topicHasNotes(topic: Item, noteIds: string[]) {
  const notes: string[] = db.notes?.topicReferences.get(topic.id) || [];
  return noteIds.some((id) => notes.indexOf(id) > -1);
}

export default MoveDialog;

type TreeNodeProps<T extends Item> = {
  item: T;
  items?: T[];
  sx?: ThemeUIStyleObject;
  isSelected: (item: T) => boolean;
  onSelected: (item: T) => void;
  onCreateItem?: (title: string) => void;
  placeholder?: JSX.Element;
};

function TreeNode<T extends Item>(props: TreeNodeProps<T>) {
  const { isSelected, item, items, onCreateItem, onSelected, sx, placeholder } =
    props;

  const [expanded, setExpanded] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const _isSelected = useMemo(() => isSelected(item), [item, isSelected]);

  return (
    <Flex sx={{ flexDirection: "column" }} data-test-id={item.type}>
      <TreeItem
        title={item.title}
        testId={`tree-item`}
        isSelected={_isSelected}
        icon={
          _isSelected
            ? Icon.Checkmark
            : items
            ? expanded
              ? Icon.ChevronDown
              : Icon.ChevronRight
            : Icon.Topic
        }
        sx={{
          bg: _isSelected ? "shade" : "transparent",
          ...sx
        }}
        onExpand={() => {
          if (items) {
            setExpanded((s) => !s);
            return;
          }
          onSelected(item);
        }}
        onCreateItem={
          items && onCreateItem
            ? () => {
                setExpanded(true);
                setIsCreatingNew(true);
              }
            : null
        }
      />
      {expanded ? (
        <>
          {isCreatingNew ? (
            <Flex sx={{ pl: 3, my: 1 }}>
              <Input
                data-test-id={`new-tree-item-input`}
                autoFocus
                sx={{ bg: "background", p: "7px" }}
                placeholder="Press enter to create a new topic"
                onBlur={() => setIsCreatingNew(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsCreatingNew(false);
                    onCreateItem?.((e.target as HTMLInputElement).value);
                  } else if (e.key === "Escape") {
                    setIsCreatingNew(false);
                  }
                }}
              />
            </Flex>
          ) : null}
          {items?.length
            ? items?.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  isSelected={isSelected}
                  onSelected={() => onSelected(item)}
                  sx={{ pl: 3 }}
                />
              ))
            : placeholder}
        </>
      ) : null}
    </Flex>
  );
}

type TreeItemProps = {
  title: string;
  onExpand: () => void;
  icon: (props: { size: number }) => JSX.Element;
  sx?: ThemeUIStyleObject;
  onCreateItem?: (() => void) | null;
  testId?: string;
  isSelected: boolean;
};

function TreeItem(props: TreeItemProps) {
  const {
    icon: TreeItemIcon,
    onCreateItem,
    onExpand,
    title,
    sx,
    testId,
    isSelected
  } = props;

  return (
    <Flex
      sx={{
        alignItems: "center",
        p: "3px",
        cursor: "pointer",
        ":hover": { bg: isSelected ? "dimPrimary" : "hover" },
        justifyContent: "space-between",
        ...sx
      }}
      onClick={onExpand}
      data-test-id={testId}
    >
      <Flex>
        {TreeItemIcon && <TreeItemIcon size={18} />}
        <Text
          variant={"body"}
          sx={{ fontSize: "subtitle" }}
          data-test-id="title"
        >
          {title}
        </Text>
      </Flex>
      {onCreateItem && (
        <Button
          variant="tool"
          sx={{ p: "2px" }}
          onClick={(e) => {
            e.stopPropagation();
            onCreateItem();
          }}
          data-test-id="tree-item-new"
        >
          <Icon.Plus size={18} />
        </Button>
      )}
    </Flex>
  );
}
