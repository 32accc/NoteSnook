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

import { Locator } from "@playwright/test";
import { BaseItemModel } from "./base-item.model";
import { ContextMenuModel } from "./context-menu.model";
import { ToggleModel } from "./toggle.model";
import { ItemsViewModel } from "./items-view.model";
import { Notebook } from "./types";
import { confirmDialog, fillNotebookDialog } from "./utils";
import { NotesViewModel } from "./notes-view.model";

export class NotebookItemModel extends BaseItemModel {
  private readonly contextMenu: ContextMenuModel;
  constructor(locator: Locator) {
    super(locator);
    this.contextMenu = new ContextMenuModel(this.page);
  }

  async openNotebook() {
    await this.locator.click();
    return {
      topics: new ItemsViewModel(this.page, "topics"),
      notes: new NotesViewModel(this.page, "notebook")
    };
  }

  async editNotebook(notebook: Notebook) {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("edit");

    await fillNotebookDialog(this.page, notebook, true);
  }

  async moveToTrash(deleteContainedNotes = false) {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("movetotrash");

    if (deleteContainedNotes)
      await this.page.locator("#deleteContainingNotes").check({ force: true });

    await confirmDialog(this.page);
    await this.waitFor("detached");
  }

  async pin() {
    await this.contextMenu.open(this.locator);
    await new ToggleModel(this.page, "menuitem-pin").on();
  }

  async unpin() {
    await this.contextMenu.open(this.locator);
    await new ToggleModel(this.page, "menuitem-pin").off();
  }

  async isPinned() {
    await this.contextMenu.open(this.locator);
    const state = await new ToggleModel(this.page, "menuitem-pin").isToggled();
    await this.contextMenu.close();
    return state;
  }

  async createShortcut() {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("shortcut");
  }

  async removeShortcut() {
    await this.contextMenu.open(this.locator);
    await this.contextMenu.clickOnItem("shortcut");
  }

  async isShortcut() {
    await this.contextMenu.open(this.locator);
    const state =
      (await this.contextMenu.getItem("shortcut").textContent()) ===
      "Remove shortcut";
    await this.contextMenu.close();
    return state;
  }
}
