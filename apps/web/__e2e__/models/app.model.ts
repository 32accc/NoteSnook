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

import { Page } from "@playwright/test";
import { getTestId } from "../utils";
import { AuthModel } from "./auth.model";
import { CheckoutModel } from "./checkout.model";
import { ItemsViewModel } from "./items-view.model";
import { NavigationMenuModel } from "./navigation-menu.model";
import { NotebooksViewModel } from "./notebooks-view.model";
import { NotesViewModel } from "./notes-view.model";
import { SettingsViewModel } from "./settings-view.model";
import { ToastsModel } from "./toasts.model";
import { TrashViewModel } from "./trash-view.model";

export class AppModel {
  private readonly page: Page;
  readonly toasts: ToastsModel;
  readonly navigation: NavigationMenuModel;
  readonly auth: AuthModel;
  readonly checkout: CheckoutModel;

  constructor(page: Page) {
    this.page = page;
    this.toasts = new ToastsModel(page);
    this.navigation = new NavigationMenuModel(page);
    this.auth = new AuthModel(page);
    this.checkout = new CheckoutModel(page);
  }

  async goto() {
    await this.page.goto("/");
    await this.getRouteHeader();
  }

  async goToNotes() {
    await this.navigateTo("Notes");
    return new NotesViewModel(this.page, "home");
  }

  async goToNotebooks() {
    await this.navigateTo("Notebooks");
    return new NotebooksViewModel(this.page);
  }

  async goToFavorites() {
    await this.navigateTo("Favorites");
    return new NotesViewModel(this.page, "notes");
  }

  async goToTags() {
    await this.navigateTo("Tags");
    return new ItemsViewModel(this.page, "tags");
  }

  async goToColor(color: string) {
    await this.navigateTo(color);
    return new NotesViewModel(this.page, "notes");
  }

  async goToTrash() {
    await this.navigateTo("Trash");
    return new TrashViewModel(this.page);
  }

  async goToSettings() {
    await this.navigateTo("Settings");
    return new SettingsViewModel(this.page);
  }

  private async navigateTo(title: string) {
    if ((await this.getRouteHeader()) === title) return;
    const item = await this.navigation.findItem(title);
    await item?.click();
    await this.page.waitForTimeout(1000);
  }

  getRouteHeader() {
    return this.page.locator(getTestId("routeHeader")).inputValue();
  }

  async isSynced() {
    return (
      (await this.page
        .locator(getTestId("sync-status-completed"))
        .isVisible()) ||
      (await this.page.locator(getTestId("sync-status-synced")).isVisible())
    );
  }
}
