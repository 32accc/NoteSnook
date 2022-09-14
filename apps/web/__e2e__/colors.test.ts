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
import { test, expect } from "@playwright/test";
import { AppModel } from "./models/app.model";
import { NOTE } from "./utils";

test("delete the last note of a color", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.color("red");
  await app.navigation.findItem("red");

  await note?.contextMenu.moveToTrash();

  await app.goToTrash();
  expect(await app.getRouteHeader()).toBe("Trash");
});

test("rename color", async ({ page }) => {
  const app = new AppModel(page);
  await app.goto();
  const notes = await app.goToNotes();
  const note = await notes.createNote(NOTE);
  await note?.contextMenu.color("red");
  const colorItem = await app.navigation.findItem("red");

  await colorItem?.renameColor("priority-33");

  expect(await app.navigation.findItem("priority-33"));
});
