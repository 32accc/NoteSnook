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

import { StorageInterface, databaseTest } from "./utils";

beforeEach(() => {
  StorageInterface.clear();
});

test("adding a deleted content should not throw", () =>
  databaseTest().then(async (db) => {
    await expect(
      db.content.add({
        remote: true,
        deleted: true,
        dateEdited: new Date(),
        id: "hello",
        data: "YOYO!"
      })
    ).resolves.toBeUndefined();
  }));
