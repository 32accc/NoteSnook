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

declare global {
  interface Window {
    WEB_EXTENSION_CHANNEL?: MessageChannel;
  }
}

export type ClipArea = "full-page" | "visible" | "selection" | "article";

export type ClipMode = "simplified" | "screenshot" | "complete";

export type User = {
  email: string;
  pro: boolean;
  accent: string;
  theme: "dark" | "light";
};
export type ItemReference = {
  id: string;
  title: string;
};

export type NotebookReference = ItemReference & {
  topics: ItemReference[];
};

export type ClientMetadata = {
  id: string;
  name: string;
};

export interface Gateway {
  connect(): ClientMetadata;
}

export type SelectedNotebook = ItemReference & { topic: ItemReference };

export type Clip = {
  url: string;
  title: string;
  data: string;
  area: ClipArea;
  mode: ClipMode;
  pageTitle?: string;
  tags?: string[];
  note?: ItemReference;
  notebook?: SelectedNotebook;
};

export interface Server {
  login(): Promise<User | null>;
  getNotes(): Promise<ItemReference[] | undefined>;
  getNotebooks(): Promise<NotebookReference[] | undefined>;
  getTags(): Promise<ItemReference[] | undefined>;
  saveClip(clip: Clip): Promise<void>;
}

export const WEB_EXTENSION_CHANNEL_EVENTS = {
  ON_CREATED: "web-extension-channel-created",
  ON_READY: "web-extension-channel-ready"
} as const;
