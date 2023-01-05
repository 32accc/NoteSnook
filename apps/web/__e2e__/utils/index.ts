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

import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { Locator, Page } from "@playwright/test";
import { GroupByOptions, OrderByOptions, SortByOptions } from "../models/types";

type Note = {
  title: string;
  content?: string;
};

dotenv.config({ path: path.join(__dirname, ".env.local") });

const USER = {
  NEW: {
    email: process.env.USER_EMAIL,
    password: process.env.NEW_USER_PASSWORD,
    key: process.env.NEW_USER_KEY,
    totpSecret: process.env.USER_TOTP_SECRET
  },
  CURRENT: {
    email: process.env.USER_EMAIL,
    password: process.env.CURRENT_USER_PASSWORD,
    key: process.env.CURRENT_USER_KEY,
    totpSecret: process.env.USER_TOTP_SECRET
  }
};

const NOTEBOOK = {
  title: "Test notebook 1",
  description: "This is test notebook 1",
  topics: ["Topic 1", "Very long topic 2", "Topic 3"]
};

const NOTE: Note = {
  title: "Test 1",
  content: "This is " + "Test 1".repeat(10)
};

const TITLE_ONLY_NOTE: Note = {
  title: "Only a title"
};

const PASSWORD = "123abc123abc";

function getTestId<TId extends string>(id: TId): `[data-test-id="${TId}"]` {
  return `[data-test-id="${id}"]`;
}

async function createNote(page: Page, note: Note) {
  await page.locator(getTestId("notes-action-button")).click();

  await editNote(page, note);
}

async function editNote(page: Page, note: Partial<Note>, noDelay = false) {
  const prosemirror = page.locator(".ProseMirror");

  if (note.title) {
    const title = page.locator(getTestId("editor-title"));
    await title.fill(note.title);
  }
  if (note.content) {
    if (!noDelay) await page.waitForTimeout(100);

    await prosemirror.focus();

    await prosemirror.type(note.content);
  }

  // a short delay so the note can be saved
  if (!noDelay) await page.waitForTimeout(200);
}

async function downloadAndReadFile(
  page: Page,
  action: Locator,
  encoding: BufferEncoding = "utf-8"
) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    await action.click()
  ]);

  const path = await download.path();
  if (!path) throw new Error("Download path not found.");

  return fs.readFileSync(path, { encoding });
}

async function uploadFile(page: Page, action: Locator, filename: string) {
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    await action.click()
  ]);

  await fileChooser.setFiles(path.join(__dirname, "../data", filename));
}

function isTestAll() {
  return process.env.TEST_ALL === "true";
}

const orderByOptions: OrderByOptions[] = ["asc", "desc"];
const sortByOptions: SortByOptions[] = [
  "dateCreated",
  "dateEdited",
  "dateModified",
  "dateDeleted"
];
const groupByOptions: GroupByOptions[] = [
  "abc",
  "none",
  "default",
  "year",
  "month",
  "week"
];

export {
  USER,
  NOTE,
  TITLE_ONLY_NOTE,
  NOTEBOOK,
  PASSWORD,
  getTestId,
  createNote,
  editNote,
  downloadAndReadFile,
  uploadFile,
  isTestAll,
  orderByOptions,
  sortByOptions,
  groupByOptions
};
