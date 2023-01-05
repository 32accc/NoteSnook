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

import { navigate } from "../../navigation";
import Note from "../note";
import Notebook from "../notebook";
import Tag from "../tag";
import Topic from "../topic";
import TrashItem from "../trash-item";
import Attachment from "../attachment";
import { db } from "../../common/db";
import { getTotalNotes } from "../../common";
import Reminder from "../reminder";
import type { Reminder as ReminderType } from "@notesnook/core/collections/reminders";

const SINGLE_LINE_HEIGHT = 1.4;
const DEFAULT_LINE_HEIGHT =
  (document.getElementById("p")?.clientHeight || 16) - 1;
export const DEFAULT_ITEM_HEIGHT = SINGLE_LINE_HEIGHT * 2 * DEFAULT_LINE_HEIGHT;
// const MAX_HEIGHTS = {
//   note: SINGLE_LINE_HEIGHT * 7 * DEFAULT_LINE_HEIGHT,
//   notebook: SINGLE_LINE_HEIGHT * 7 * DEFAULT_LINE_HEIGHT,
//   generic: SINGLE_LINE_HEIGHT * 4 * DEFAULT_LINE_HEIGHT
// };

export type Item = { id: string; type: string; title: string } & Record<
  string,
  unknown
>;

type NotebookReference = Item & { topics: string[] };
type NotebookType = Item & { topics: Item[] };

export type Context = { type: string } & Record<string, unknown>;
type ItemWrapperProps<TItem = Item> = {
  index: number;
  item: TItem;
  type: keyof typeof ListProfiles;
  context?: Context;
};

type ItemWrapper<TItem = Item> = (
  props: ItemWrapperProps<TItem>
) => JSX.Element;

const NotesProfile: ItemWrapper = ({ index, item, type, context }) => (
  <Note
    index={index}
    pinnable={!context}
    item={item}
    tags={getTags(item)}
    notebook={getNotebook(item.notebooks as Item[], context?.type)}
    date={getDate(item, type)}
    context={context}
  />
);

const NotebooksProfile: ItemWrapper = ({ index, item, type }) => (
  <Notebook
    index={index}
    item={item}
    totalNotes={getTotalNotes(item)}
    date={getDate(item, type)}
  />
);

const TagsProfile: ItemWrapper = ({ index, item }) => (
  <Tag item={item} index={index} />
);

const TopicsProfile: ItemWrapper = ({ index, item, context }) => (
  <Topic
    index={index}
    item={item}
    onClick={() =>
      context ? navigate(`/notebooks/${context.notebookId}/${item.id}`) : null
    }
  />
);

const RemindersProfile: ItemWrapper<ReminderType> = ({ index, item }) => (
  <Reminder item={item} index={index} />
);

const TrashProfile: ItemWrapper = ({ index, item, type }) => (
  <TrashItem index={index} item={item} date={getDate(item, type)} />
);

const AttachmentProfile: ItemWrapper = ({ index, item }) => (
  <Attachment index={index} item={item} isCompact={false} />
);

export const ListProfiles = {
  home: NotesProfile,
  notebooks: NotebooksProfile,
  notes: NotesProfile,
  reminders: RemindersProfile,
  tags: TagsProfile,
  topics: TopicsProfile,
  trash: TrashProfile,
  attachments: AttachmentProfile
} as const;

function getTags(item: Item) {
  let tags = item.tags as Item[];
  if (tags)
    tags = tags.slice(0, 3).reduce((prev, curr) => {
      const tag = db.tags?.tag(curr);
      if (tag) prev.push(tag);
      return prev;
    }, [] as Item[]);
  return tags || [];
}

type NotebookResult =
  | {
      id: string;
      title: string;
      dateEdited: number;
      topic: { id: string; title: string };
    }
  | undefined;

function getNotebook(
  notebooks: Item[],
  contextType?: string
): NotebookResult | undefined {
  if (contextType === "topic" || !notebooks?.length) return;

  return notebooks.reduce<NotebookResult>(function (
    prev: NotebookResult,
    curr
  ): NotebookResult {
    if (prev) return prev;
    const topicId = (curr as NotebookReference).topics[0];
    const notebook = db.notebooks?.notebook(curr.id)?.data as NotebookType;
    if (!notebook) return;

    const topic = notebook.topics.find((t: Item) => t.id === topicId);
    if (!topic) return;

    return {
      id: notebook.id,
      title: notebook.title,
      dateEdited: notebook.dateEdited,
      topic: { id: topicId, title: topic.title }
    } as NotebookResult;
  },
  undefined as NotebookResult);
}

function getDate(item: Item, groupType: keyof typeof ListProfiles) {
  if (groupType === "attachments") return item.dateCreated;

  const sortBy = db.settings?.getGroupOptions(groupType).sortBy;
  switch (sortBy) {
    case "dateEdited":
      return item.dateEdited;
    case "dateCreated":
      return item.dateCreated;
    case "dateModified":
      return item.dateModified;
    case "dateDeleted":
      return item.dateDeleted;
    default:
      return item.dateCreated;
  }
}
