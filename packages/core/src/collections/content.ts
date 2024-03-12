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

import { ICollection } from "./collection";
import { getId } from "../utils/id";
import { getContentFromData } from "../content-types";
import { ResolveHashes } from "../content-types/tiptap";
import { isCipher } from "../database/crypto";
import {
  Attachment,
  ContentItem,
  ContentType,
  UnencryptedContentItem,
  isDeleted
} from "../types";
import Database from "../api";
import { getOutputType } from "./attachments";
import { SQLCollection } from "../database/sql-collection";
import { NoteContent } from "./session-content";
import { InternalLink } from "../utils/internal-link";

export const EMPTY_CONTENT = (noteId: string): UnencryptedContentItem => ({
  noteId,
  dateCreated: Date.now(),
  dateEdited: Date.now(),
  dateModified: Date.now(),
  id: getId(),
  localOnly: true,
  type: "tiptap",
  data: "<p></p>",
  locked: false
});

export class Content implements ICollection {
  name = "content";
  readonly collection: SQLCollection<"content", ContentItem>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "content",
      db.eventManager
    );
  }

  async init() {
    await this.collection.init();
  }

  async add(content: Partial<ContentItem>) {
    if (typeof content.data === "object") {
      if ("data" in content.data && typeof content.data.data === "string")
        content.data = content.data.data;
      else if (!content.data.iv && !content.data.cipher)
        content.data = `<p>Content is invalid: ${JSON.stringify(
          content.data
        )}</p>`;
    }

    if (content.remote)
      throw new Error(
        "Please use db.content.merge for merging remote content."
      );

    if (content.noteId && !content.id) {
      // find content from noteId
      content.id = (
        await this.db
          .sql()
          .selectFrom("content")
          .where("noteId", "==", content.noteId)
          .select("id")
          .executeTakeFirst()
      )?.id;
    }

    const id = content.id || getId();

    const encryptedData = isCipher(content.data) ? content.data : undefined;
    let unencryptedData =
      typeof content.data === "string" ? content.data : undefined;

    if (unencryptedData && content.type && content.noteId)
      unencryptedData = await this.postProcess({
        type: content.type,
        data: unencryptedData,
        noteId: content.noteId
      });

    if (content.id && (await this.exists(content.id))) {
      const contentData = encryptedData
        ? { locked: true as const, data: encryptedData }
        : unencryptedData
        ? { locked: false as const, data: unencryptedData }
        : undefined;

      await this.collection.update([content.id], {
        dateEdited: content.dateEdited,
        localOnly: content.localOnly,
        conflicted: content.dateResolved ? null : content.conflicted,
        dateResolved: content.dateResolved,
        noteId: content.noteId,
        ...contentData
      });

      if (content.sessionId && contentData && content.type && content.noteId) {
        await this.db.noteHistory.add(content.sessionId, {
          noteId: content.noteId,
          type: content.type,
          ...contentData
        });
      }
    } else if (content.noteId) {
      const contentItem: ContentItem = {
        type: "tiptap",
        noteId: content.noteId,
        id,

        dateEdited: content.dateEdited || Date.now(),
        dateCreated: content.dateCreated || Date.now(),
        dateModified: Date.now(),
        localOnly: !!content.localOnly,

        conflicted: content.conflicted,
        dateResolved: content.dateResolved,

        ...(encryptedData
          ? { locked: true, data: encryptedData }
          : { locked: false, data: unencryptedData || "<p></p>" })
      };

      await this.collection.upsert(contentItem);

      if (content.sessionId)
        await this.db.noteHistory.add(content.sessionId, contentItem);
    } else return;

    return id;
  }

  async get(id: string) {
    const content = await this.collection.get(id);
    if (!content || isDeleted(content)) return;
    return content;
  }

  // async raw(id: string) {
  //   const content = await this.collection.get(id);
  //   if (!content) return;
  //   return content;
  // }

  remove(...ids: string[]) {
    return this.collection.softDelete(ids);
  }

  removeByNoteId(...ids: string[]) {
    return this.db
      .sql()
      .replaceInto("content")
      .columns(["id", "dateModified", "deleted"])
      .expression((eb) =>
        eb
          .selectFrom("content")
          .where("noteId", "in", ids)
          .select((eb) => [
            "content.id",
            eb.lit(Date.now()).as("dateModified"),
            eb.lit(1).as("deleted")
          ])
      )
      .execute();
  }

  async updateByNoteId(partial: Partial<ContentItem>, ...ids: string[]) {
    await this.db
      .sql()
      .updateTable("content")
      .where("noteId", "in", ids)
      .set({
        ...partial,
        dateModified: Date.now()
      })
      .execute();
  }

  async findByNoteId(noteId: string) {
    const content = (await this.db
      .sql()
      .selectFrom("content")
      .where("noteId", "==", noteId)
      .selectAll()
      .executeTakeFirst()) as ContentItem;
    if (!content || isDeleted(content)) return;
    return content;
  }

  // multi(ids: string[]) {
  //   return this.collection.getItems(ids);
  // }

  exists(id: string) {
    return this.collection.exists(id);
  }

  // async all() {
  //   return Object.values(
  //     await this.collection.getItems(this.collection.indexer.indices)
  //   );
  // }

  insertMedia(contentItem: UnencryptedContentItem) {
    return this.insert(contentItem, async (hashes) => {
      const sources: Record<string, string> = {};
      for (const hash of hashes) {
        const src = await this.db.attachments.read(hash, "base64");
        if (!src) continue;
        sources[hash] = src;
      }
      return sources;
    });
  }

  insertPlaceholders(contentItem: UnencryptedContentItem, placeholder: string) {
    return this.insert(contentItem, async (hashes) => {
      return Object.fromEntries(hashes.map((h) => [h, placeholder]));
    });
  }

  async downloadMedia(
    groupId: string,
    contentItem: { type: ContentType; data: string },
    notify = true
  ) {
    const content = getContentFromData(contentItem.type, contentItem.data);
    if (!content) return contentItem;
    contentItem.data = await content.insertMedia(async (hashes) => {
      const attachments: Attachment[] = [];
      for (const hash of hashes) {
        const attachment = await this.db.attachments.attachment(hash);
        if (!attachment) continue;
        attachments.push(attachment);
      }

      await this.db.fs().queueDownloads(
        attachments.map((a) => ({
          filename: a.hash,
          chunkSize: a.chunkSize
        })),
        groupId,
        notify ? { readOnDownload: false } : undefined
      );

      const sources: Record<string, string> = {};
      for (const attachment of attachments) {
        const src = await this.db.attachments.read(
          attachment.hash,
          getOutputType(attachment)
        );
        if (!src) continue;
        sources[attachment.hash] = src;
      }
      return sources;
    });
    return contentItem;
  }

  private async insert(
    contentItem: UnencryptedContentItem,
    getData: ResolveHashes
  ) {
    const content = getContentFromData(contentItem.type, contentItem.data);
    if (!content) return contentItem;
    contentItem.data = await content.insertMedia(getData);
    return contentItem;
  }

  async removeAttachments(id: string, hashes: string[]) {
    const contentItem = await this.get(id);
    if (!contentItem || isCipher(contentItem.data)) return;
    const content = getContentFromData(contentItem.type, contentItem.data);
    if (!content) return;
    contentItem.data = content.removeAttachments(hashes);
    await this.add(contentItem);
  }

  async postProcess(contentItem: NoteContent<false> & { noteId: string }) {
    const content = getContentFromData(contentItem.type, contentItem.data);
    if (!content) return contentItem.data;
    const { data, hashes, internalLinks } = await content.postProcess(
      this.db.attachments.save
    );

    await this.processInternalLinks(contentItem.noteId, internalLinks);
    await this.processLinkedAttachments(contentItem.noteId, hashes);

    return data;
  }

  private async processLinkedAttachments(noteId: string, hashes: string[]) {
    const noteAttachments = await this.db.relations
      .from({ type: "note", id: noteId }, "attachment")
      .selector.filter.select(["id", "hash"])
      .execute();

    const toDelete = noteAttachments.filter((attachment) => {
      return hashes.every((hash) => hash !== attachment.hash);
    });

    for (const attachment of toDelete) {
      await this.db.relations.unlink(
        {
          id: noteId,
          type: "note"
        },
        { id: attachment.id, type: "attachment" }
      );
    }

    const toAdd = hashes.filter((hash) => {
      return hash && noteAttachments.every((a) => hash !== a.hash);
    });

    const attachments = await this.db.attachments.all
      .fields(["attachments.id"])
      .where((eb) => eb("hash", "in", toAdd))
      .items();
    for (const attachment of attachments) {
      await this.db.relations.add(
        {
          id: noteId,
          type: "note"
        },
        { id: attachment.id, type: "attachment" }
      );
    }
  }

  private async processInternalLinks(
    noteId: string,
    internalLinks: InternalLink[]
  ) {
    const links = await this.db.relations
      .from({ type: "note", id: noteId }, "note")
      .get();

    const toDelete = links.filter((link) => {
      return internalLinks.every((l) => l.id !== link.toId);
    });

    const toAdd = internalLinks.filter((link) => {
      return links.every((l) => link.id !== l.toId);
    });

    for (const link of toDelete) {
      await this.db.relations.unlink(
        {
          id: noteId,
          type: "note"
        },
        { id: link.toId, type: link.toType }
      );
    }

    for (const link of toAdd) {
      const note = await this.db.notes.exists(link.id);
      if (!note) continue;
      await this.db.relations.add(
        {
          id: noteId,
          type: "note"
        },
        link
      );
    }
  }
}

export function isDecryptedContent(
  content: NoteContent<boolean>
): content is NoteContent<false> {
  return !isCipher(content.data);
}

export function isEncryptedContent(
  content: NoteContent<boolean>
): content is NoteContent<true> {
  return isCipher(content.data);
}
