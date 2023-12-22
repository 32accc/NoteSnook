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

import http from "../utils/http";
import Constants from "../utils/constants";
import Database from ".";
import { Note, isDeleted } from "../types";
import { isUnencryptedContent } from "../collections/content";
import { Cipher } from "@notesnook/crypto";

type BaseMonograph = {
  id: string;
  title: string;
  userId: string;
  selfDestruct: boolean;
};
type UnencryptedMonograph = BaseMonograph & {
  content: string;
};
type EncryptedMonograph = BaseMonograph & {
  encryptedContent: Cipher<"base64">;
};
type Monograph = UnencryptedMonograph | EncryptedMonograph;

export class Monographs {
  monographs: string[] = [];
  constructor(private readonly db: Database) {}

  async clear() {
    this.monographs = [];
    await this.db.storage().write("monographs", this.monographs);
  }

  async refresh() {
    try {
      const user = await this.db.user.getUser();
      const token = await this.db.tokenManager.getAccessToken();
      if (!user || !token || !user.isEmailConfirmed) return;

      const monographs = await http.get(
        `${Constants.API_HOST}/monographs`,
        token
      );
      await this.db.storage().write("monographs", monographs);
      if (monographs) this.monographs = monographs;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Check if note is published.
   */
  isPublished(noteId: string) {
    return this.monographs && this.monographs.indexOf(noteId) > -1;
  }

  /**
   * Get note published monograph id
   */
  monograph(noteId: string) {
    return this.monographs[this.monographs.indexOf(noteId)];
  }

  /**
   * Publish a note as a monograph
   */
  async publish(
    noteId: string,
    opts: { password?: string; selfDestruct?: boolean } = {}
  ) {
    if (!this.monographs.length) await this.refresh();

    const update = !!this.isPublished(noteId);

    const user = await this.db.user.getUser();
    const token = await this.db.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    const note = this.db.notes.note(noteId);
    if (!note) throw new Error("No such note found.");
    if (!note.data.contentId) throw new Error("Cannot publish an empty note.");

    const contentItem = await this.db.content.raw(note.data.contentId);

    if (!contentItem || isDeleted(contentItem))
      throw new Error("Could not find content for this note.");

    if (!isUnencryptedContent(contentItem))
      throw new Error("Cannot published locked notes.");

    const content = await this.db.content.downloadMedia(
      `monograph-${noteId}`,
      contentItem,
      false
    );

    const monograph: Monograph = {
      id: noteId,
      title: note.title,
      userId: user.id,
      selfDestruct: opts.selfDestruct || false,
      ...(opts.password
        ? {
            encryptedContent: await this.db
              .storage()
              .encrypt(
                { password: opts.password },
                JSON.stringify({ type: content.type, data: content.data })
              )
          }
        : {
            content: JSON.stringify({
              type: content.type,
              data: content.data
            })
          })
    };

    const method = update ? http.patch.json : http.post.json;

    const { id } = await method(
      `${Constants.API_HOST}/monographs`,
      monograph,
      token
    );

    this.monographs.push(id);
    return id;
  }

  /**
   * Unpublish a note
   */
  async unpublish(noteId: string) {
    if (!this.monographs.length) await this.refresh();

    const user = await this.db.user.getUser();
    const token = await this.db.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    if (!this.isPublished(noteId))
      throw new Error("This note is not published.");

    await http.delete(`${Constants.API_HOST}/monographs/${noteId}`, token);

    this.monographs.splice(this.monographs.indexOf(noteId), 1);
  }

  get all() {
    if (!this.monographs.length) return [];

    return this.monographs
      .map((noteId) => this.db.notes.note(noteId)?.data)
      .filter(Boolean) as Note[];
  }

  get(monographId: string) {
    return http.get(`${Constants.API_HOST}/monographs/${monographId}`);
  }
}
