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

import { expose, Remote, wrap } from "comlink";
import { updateStatus } from "../hooks/use-status";
import { db } from "../common/db";
import {
  Gateway,
  ItemReference,
  NotebookReference,
  Server,
  Clip,
  WEB_EXTENSION_CHANNEL_EVENTS
} from "@notesnook/web-clipper/dist/common/bridge";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { store as themestore } from "../stores/theme-store";
import { store as appstore } from "../stores/app-store";
import { formatDate } from "@notesnook/core/utils/date";
import { h } from "./html";
import { sanitizeFilename } from "./filename";
import { attachFile } from "../components/editor/picker";

export class WebExtensionRelay {
  private gateway?: Remote<Gateway>;
  constructor() {
    window.addEventListener("message", async (ev) => {
      const { type } = ev.data;
      switch (type) {
        case WEB_EXTENSION_CHANNEL_EVENTS.ON_READY:
          this.gateway = undefined;
          await this.connect();
          break;
      }
    });
  }

  async connect(): Promise<boolean> {
    if (this.gateway) return true;
    const channel = new MessageChannel();
    channel.port1.start();
    channel.port2.start();

    window.postMessage({ type: WEB_EXTENSION_CHANNEL_EVENTS.ON_CREATED }, "*", [
      channel.port2
    ]);

    const { port1 } = channel;

    expose(new WebExtensionServer(), port1);
    this.gateway = wrap(port1);

    const metadata = await this.gateway.connect();

    updateStatus({
      key: metadata.id,
      status: `${metadata.name} connected`,
      icon: "extension"
    });

    return true;
  }
}

class WebExtensionServer implements Server {
  async login() {
    const user = await db.user?.getUser();
    if (!user) return null;
    const { theme, accent } = themestore.get();
    return { email: user.email, pro: isUserPremium(user), accent, theme };
  }

  async getNotes(): Promise<ItemReference[] | undefined> {
    await db.notes?.init();

    return db.notes?.all
      .filter((n) => !n.locked)
      .map((note) => ({ id: note.id, title: note.title }));
  }

  async getNotebooks(): Promise<NotebookReference[] | undefined> {
    return db.notebooks?.all.map((nb) => ({
      id: nb.id,
      title: nb.title,
      topics: nb.topics.map((topic: ItemReference) => ({
        id: topic.id,
        title: topic.title
      }))
    }));
  }

  async getTags(): Promise<ItemReference[] | undefined> {
    return db.tags?.all.map((tag) => ({
      id: tag.id,
      title: tag.title
    }));
  }

  async saveClip(clip: Clip) {
    let clipContent = "";

    if (clip.mode === "simplified" || clip.mode === "screenshot") {
      clipContent += clip.data;
    } else {
      const clippedFile = new File(
        [new TextEncoder().encode(clip.data).buffer],
        `${sanitizeFilename(clip.title)}.clip`,
        {
          type: "application/vnd.notesnook.web-clip"
        }
      );

      const attachment = await attachFile(clippedFile);
      if (!attachment) return;

      clipContent += h("iframe", [], {
        "data-hash": attachment.hash,
        "data-mime": attachment.type,
        src: clip.url,
        title: clip.pageTitle || clip.title,
        width: clip.width ? `${clip.width}` : undefined,
        height: clip.height ? `${clip.height}` : undefined,
        class: "web-clip"
      }).outerHTML;
    }

    const note =
      (clip.note?.id && db.notes?.note(clip.note?.id)) ||
      db.notes?.note(await db.notes?.add({ title: clip.title }));
    let content = (await note?.content()) || "";
    content += clipContent;
    content += h("div", [
      h("hr"),
      h("p", ["Clipped from ", h("a", [clip.title], { href: clip.url })]),
      h("p", [`Date clipped: ${formatDate(Date.now())}`])
    ]).innerHTML;

    await db.notes?.add({
      id: note?.id,
      content: { type: "tiptap", data: content }
    });

    if (clip.notebook && note) {
      await db.notes?.addToNotebook(
        { id: clip.notebook.id, topic: clip.notebook.topic.id },
        note.id
      );
    }
    if (clip.tags && note) {
      for (const tag of clip.tags) {
        await db.tags?.add(tag, note.id);
      }
    }
    await appstore.refresh();
  }
}
