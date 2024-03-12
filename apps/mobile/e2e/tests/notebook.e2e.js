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

import { notesnook } from "../test.ids";
import {
  tapById,
  elementById,
  visibleByText,
  tapByText,
  createNote,
  prepare,
  notVisibleById,
  navigate,
  elementByText,
  sleep,
  notVisibleByText,
  visibleById,
  createNotebook
} from "./utils";

// async function addTopic(title = "Topic") {
//   await tapById(notesnook.buttons.add);
//   await elementById("input-title").typeText(title);
//   await tapByText("Add");
//   await sleep(500);
// }

describe("NOTEBOOKS", () => {
  it("Create a notebook with title only", async () => {
    await prepare();
    await navigate("Notebooks");
    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", false, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText("Notebook 1");
  });

  it("Create a notebook title & description", async () => {
    await prepare();
    await navigate("Notebooks");
    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", true, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText("Notebook 1");
  });

  it("Create a notebook, move notes", async () => {
    await prepare();
    let note = await createNote();
    await navigate("Notebooks");
    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", true, true);
    await sleep(500);
    await tapById("listitem.select");
    await tapByText("Move selected notes");
    await sleep(500);
    await tapByText("Notebook 1");
    await sleep(500);
    await visibleByText(note.body);
  });

  it("Add a sub notebook to a notebook", async () => {
    await prepare();
    await navigate("Notebooks");
    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", true, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText("Notebook 1");
    await sleep(500);
    await tapById("add-notebook-button");
    await createNotebook("Sub notebook", true, true);
    await sleep(500);
    await device.pressBack();
    await visibleByText("Sub notebook");
    await tapById(notesnook.ids.notebook.menu);
    await tapByText("Move to trash");
    await sleep(300);
    await tapByText("Delete");
    await notVisibleByText("Sub notebook");
  });

  it("Remove a sub notebook from notebook", async () => {
    await prepare();
    await navigate("Notebooks");
    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", true, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText("Notebook 1");
    await sleep(500);
    await tapById("add-notebook-button");
    await createNotebook("Sub notebook", true, true);
    await sleep(500);
    await device.pressBack();
    await visibleByText("Sub notebook");
  });

  it("Edit notebook", async () => {
    await prepare();
    await navigate("Notebooks");
    await sleep(500);
    await tapById(notesnook.buttons.add);
    await createNotebook("Notebook 1", true);
    await sleep(500);
    await device.pressBack();
    await tapById(notesnook.ids.notebook.menu);
    await tapByText("Edit notebook");
    await elementById(notesnook.ids.dialogs.notebook.inputs.title).typeText(
      " (edited)"
    );
    await tapByText("Save");
    await visibleByText("Notebook 1 (edited)");
  });

  it("Edit a sub notebook", async () => {
    await prepare();
    await navigate("Notebooks");
    await sleep(500);
    await tapById(notesnook.buttons.add);
    await createNotebook("Notebook 1", true);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText("Notebook 1");
    await sleep(500);
    await tapById("add-notebook-button");
    await createNotebook("Sub notebook", true, true);
    await device.pressBack();
    await sleep(500);
    await tapById(notesnook.ids.notebook.menu);
    await tapByText("Edit notebook");
    await sleep(500);
    await elementById(notesnook.ids.dialogs.notebook.inputs.title).typeText(
      " (edited)"
    );
    await tapByText("Save");
    await sleep(500);
    await visibleByText("Sub notebook (edited)");
  });

  it("Add a note to notebook", async () => {
    await prepare();
    await navigate("Notebooks");
    await tapByText("Add your first notebook");
    await sleep(500);
    await createNotebook("Notebook 1", true, true);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText("Notebook 1");
    await createNote();
  });

  it("Remove note from Notebook", async () => {
    await prepare();
    await navigate("Notebooks");
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", true, true);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText("Notebook 1");
    await sleep(500);
    let note = await createNote();
    await elementByText(note.body).longPress();
    await tapById("select-minus");
    await notVisibleById(note.title);
  });

  it("Add/Remove note to notebook from home", async () => {
    await prepare();
    await navigate("Notebooks");
    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", true, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await navigate("Notes");
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById("icon-notebooks");
    await sleep(500);
    await tapByText("Notebook 1");
    await tapByText("Save");
    await sleep(300);
    await visibleByText("Notebook 1");
  });

  it("Edit notebook title, description", async () => {
    await prepare();
    await navigate("Notebooks");
    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook();
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText("Notebook 1");
    await tapById(notesnook.ids.notebook.menu);
    await tapByText("Edit notebook");
    await sleep(500);
    await elementById(notesnook.ids.dialogs.notebook.inputs.title).typeText(
      " (Edited)"
    );
    await elementById(
      notesnook.ids.dialogs.notebook.inputs.description
    ).clearText();
    await elementById(
      notesnook.ids.dialogs.notebook.inputs.description
    ).typeText("Description of Notebook 1 (Edited)");

    await tapByText("Save");
    await sleep(500);
    await visibleByText("Notebook 1 (Edited)");
    await visibleByText("Description of Notebook 1 (Edited)");
  });

  it.skip("Move notebook to trash", async () => {
    await prepare();
    await navigate("Notebooks");

    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", false, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText("Notebook 1");
    await tapById(notesnook.ids.notebook.menu);
    await tapByText("Move to trash");
    await sleep(2000);
    await tapByText("Delete");
    await sleep(4000);
    await navigate("Trash");
    await visibleByText("Notebook 1");
  });

  it("Move notebook to trash with notes", async () => {
    await prepare();
    let note = await createNote();
    await navigate("Notebooks");

    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", false, true);
    await sleep(500);
    await tapById("listitem.select");
    await tapByText("Move selected notes");
    await sleep(500);
    await visibleByText("Notebook 1");
    await tapById(notesnook.ids.notebook.menu);
    await tapByText("Move to trash");
    await sleep(2000);
    await tapByText("Move all notes in this notebook to trash");
    await sleep(500);
    await tapByText("Delete");
    await sleep(4000);
    await navigate("Trash");
    await visibleByText("Notebook 1");
    await visibleByText(note.body);
  });

  it("Pin notebook to side menu", async () => {
    await prepare();
    await navigate("Notebooks");

    await sleep(500);
    await tapByText("Add your first notebook");
    await createNotebook("Notebook 1", false, false);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await visibleByText("Notebook 1");
    await tapById(notesnook.ids.notebook.menu);
    await tapByText("Add Shortcut");
    let menu = elementById(notesnook.ids.default.header.buttons.left);
    await menu.tap();
    await visibleByText("Notebook 1");
  });
});
