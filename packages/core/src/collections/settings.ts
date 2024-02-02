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

import { makeId } from "../utils/id";
import Database from "../api";
import {
  DefaultNotebook,
  GroupOptions,
  GroupingKey,
  SettingItem,
  SettingItemMap,
  ToolbarConfig,
  ToolbarConfigPlatforms,
  TrashCleanupInterval
} from "../types";
import { ICollection } from "./collection";
import { CachedCollection } from "../database/cached-collection";
import { TimeFormat } from "../utils/date";

const DEFAULT_GROUP_OPTIONS = (key: GroupingKey) =>
  ({
    groupBy: "default",
    sortBy:
      key === "trash"
        ? "dateDeleted"
        : key === "tags"
        ? "dateCreated"
        : "dateEdited",
    sortDirection: "desc"
  } satisfies GroupOptions);

const defaultSettings: SettingItemMap = {
  timeFormat: "12-hour",
  dateFormat: "DD-MM-YYYY",
  titleFormat: "Note $date$ $time$",
  defaultNotebook: undefined,
  trashCleanupInterval: 7,

  "groupOptions:trash": DEFAULT_GROUP_OPTIONS("trash"),
  "groupOptions:tags": DEFAULT_GROUP_OPTIONS("tags"),
  "groupOptions:notes": DEFAULT_GROUP_OPTIONS("notes"),
  "groupOptions:notebooks": DEFAULT_GROUP_OPTIONS("notebooks"),
  "groupOptions:favorites": DEFAULT_GROUP_OPTIONS("favorites"),
  "groupOptions:home": DEFAULT_GROUP_OPTIONS("home"),
  "groupOptions:reminders": DEFAULT_GROUP_OPTIONS("reminders"),

  "toolbarConfig:desktop": undefined,
  "toolbarConfig:mobile": undefined
};

export class Settings implements ICollection {
  name = "settingsv2";
  readonly collection: CachedCollection<"settingsv2", SettingItem>;
  constructor(db: Database) {
    this.collection = new CachedCollection(
      db.storage,
      "settingsv2",
      db.eventManager
    );
  }

  init() {
    return this.collection.init();
  }

  get raw() {
    return this.collection.raw();
  }

  private async set<TKey extends keyof SettingItemMap>(
    key: TKey,
    value: SettingItemMap[TKey]
  ) {
    const id = makeId(key);
    const oldItem = this.collection.get(id);
    if (oldItem && oldItem.key !== key) throw new Error("Key conflict.");

    await this.collection.add({
      id,
      key,
      value,
      type: "settingitem",
      dateCreated: oldItem?.dateCreated || Date.now(),
      dateModified: oldItem?.dateCreated || Date.now()
    });
    return id;
  }

  private get<TKey extends keyof SettingItemMap>(
    key: TKey
  ): SettingItemMap[TKey] {
    const item = this.collection.get(makeId(key)) as
      | SettingItem<TKey>
      | undefined;
    if (!item || item.key !== key) return defaultSettings[key];
    return item.value;
  }

  getGroupOptions(key: GroupingKey) {
    return this.get(`groupOptions:${key}`);
  }

  setGroupOptions(key: GroupingKey, groupOptions: GroupOptions) {
    return this.set(`groupOptions:${key}`, groupOptions);
  }

  setToolbarConfig(platform: ToolbarConfigPlatforms, config: ToolbarConfig) {
    return this.set(`toolbarConfig:${platform}`, config);
  }

  getToolbarConfig(platform: ToolbarConfigPlatforms) {
    return this.get(`toolbarConfig:${platform}`);
  }

  setTrashCleanupInterval(interval: TrashCleanupInterval) {
    return this.set("trashCleanupInterval", interval);
  }

  getTrashCleanupInterval() {
    return this.get("trashCleanupInterval");
  }

  setDefaultNotebook(item: DefaultNotebook | undefined) {
    return this.set("defaultNotebook", item);
  }

  getDefaultNotebook() {
    return this.get("defaultNotebook");
  }

  setTitleFormat(format: string) {
    return this.set("titleFormat", format);
  }

  getTitleFormat() {
    return this.get("titleFormat");
  }

  getDateFormat() {
    return this.get("dateFormat");
  }

  setDateFormat(format: string) {
    return this.set("dateFormat", format);
  }

  getTimeFormat() {
    return this.get("timeFormat");
  }

  setTimeFormat(format: TimeFormat) {
    return this.set("timeFormat", format);
  }
}
